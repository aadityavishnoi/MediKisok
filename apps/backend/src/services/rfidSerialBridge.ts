/**
 * MediKiosk - Arduino USB Serial RFID Bridge
 * 
 * Connects to the Arduino Nano running MFRC522 firmware via USB COM port.
 * Features:
 *   - Reads Serial data at 9600 baud.
 *   - Filters and parses lines matching `RFID_SCAN:<UID>`.
 *   - Normalizes UID format (e.g., uppercase colon-separated hex).
 *   - Debounces duplicate scans within configurable time window.
 *   - Gracefully handles Arduino disconnects, port unplugs, and reconnects.
 *   - Fully non-crashing: runs safely in background without killing the host server.
 */

import { DeviceStatus } from '@medikiosk/shared-types';
import { env } from '../lib/env.js';
import { wsHub } from '../ws/hub.js';
import { handleRfidScan, normalizeRfidUid, getPatientByRfid, formatRfidScanBanner } from './rfidService.js';

let SerialPortLib: any = null;
let ReadlineParserLib: any = null;

async function getSerialPortLibs() {
  if (!SerialPortLib) {
    try {
      const sp = await import('serialport');
      SerialPortLib = sp.SerialPort;
      const rp = await import('@serialport/parser-readline');
      ReadlineParserLib = rp.ReadlineParser;
    } catch {
      SerialPortLib = null;
      ReadlineParserLib = null;
    }
  }
  return { SerialPort: SerialPortLib, ReadlineParser: ReadlineParserLib };
}


export type BridgeConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface RfidSerialBridgeOptions {
  portPath?: string;
  baudRate?: number;
  debounceMs?: number;
  deviceCode?: string;
  reconnectIntervalMs?: number;
  onScan?: (uid: string) => Promise<void> | void;
  onStatusChange?: (state: BridgeConnectionState, portPath: string) => void;
}

/**
 * Flexibly extracts UID from various Arduino output formats:
 * - "RFID_SCAN:82:12:68:E9"
 * - "Card UID: 82 12 68 E9" / "Card UID: 82:12:68:E9"
 * - "UID tag: 82 12 68 E9"
 * - "UID: 82:12:68:E9" / "NUID: ..."
 * - Raw hex UID: "82:12:68:E9" or "82 12 68 E9" or "821268E9"
 */
export function extractUidFromLine(rawLine: string): string | null {
  const line = rawLine.trim();
  if (!line) return null;

  // 1. Direct RFID_SCAN:<UID>
  const rfidScanMatch = line.match(/^RFID_SCAN:\s*(.+)$/i);
  if (rfidScanMatch) {
    return rfidScanMatch[1].trim();
  }

  // 2. Common Arduino MFRC522 sketch outputs: "Card UID: 82 12 68 E9", "UID tag: ...", "NUID: ..."
  const labeledMatch = line.match(/(?:card\s*uid|uid\s*tag|card\s*nuid|nuid|\buid)\s*[:=]\s*([0-9a-fA-F\s:\-]+)/i);
  if (labeledMatch) {
    const candidate = labeledMatch[1].trim();
    if (candidate) return candidate;
  }

  // 3. Standalone hex UID line (4 to 7 bytes e.g. "82:12:68:E9" or "82 12 68 E9" or "82-12-68-E9")
  if (/^([0-9a-fA-F]{2}[:\s\-]){3,6}[0-9a-fA-F]{2}$/i.test(line)) {
    return line;
  }

  // 4. Any line containing 4 to 7 hex bytes
  const hexPatternMatch = line.match(/\b([0-9a-fA-F]{2}(?:[:\s\-][0-9a-fA-F]{2}){3,6})\b/i);
  if (hexPatternMatch) {
    return hexPatternMatch[1].trim();
  }

  // 5. Continuous 8 or 14 char hex string (e.g. "821268E9")
  const continuousMatch = line.match(/\b([0-9a-fA-F]{8}|[0-9a-fA-F]{14})\b/i);
  if (continuousMatch) {
    return continuousMatch[1].trim();
  }

  // 6. Demo token e.g. DEMO-RFID-001
  if (/^DEMO-RFID-\d{3}$/i.test(line)) {
    return line;
  }

  return null;
}

export class RfidSerialBridge {
  private portPath: string;
  private baudRate: number;
  private debounceMs: number;
  private deviceCode: string;
  private reconnectIntervalMs: number;
  private customOnScan?: (uid: string) => Promise<void> | void;
  private customOnStatusChange?: (state: BridgeConnectionState, portPath: string) => void;

  private port: any = null;
  private parser: any = null;
  private state: BridgeConnectionState = 'DISCONNECTED';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isStopped = false;

  // Debouncing tracking
  private lastScannedUid: string | null = null;
  private lastScannedAt = 0;

  constructor(options: RfidSerialBridgeOptions = {}) {
    this.portPath = options.portPath || env.RFID_SERIAL_PORT || 'COM3';
    this.baudRate = options.baudRate || env.RFID_SERIAL_BAUD || 9600;
    this.debounceMs = options.debounceMs ?? env.RFID_DEBOUNCE_MS ?? 1000;
    this.deviceCode = options.deviceCode || 'KIOSK-DEV-001';
    this.reconnectIntervalMs = options.reconnectIntervalMs || 5000;
    this.customOnScan = options.onScan;
    this.customOnStatusChange = options.onStatusChange;
  }

  /** Current connection status of the serial reader */
  public getState(): BridgeConnectionState {
    return this.state;
  }

  /** Configured baud rate */
  public getBaudRate(): number {
    return this.baudRate;
  }

  /** Port currently configured for the bridge */
  public getPortPath(): string {
    return this.portPath;
  }

  /** Change target port (e.g. if user specifies COM4 at runtime) */
  public setPortPath(newPort: string): void {
    if (this.portPath !== newPort) {
      console.log(`[RFID Serial] Switching target port: ${this.portPath} -> ${newPort}`);
      this.portPath = newPort;
      if (this.state === 'CONNECTED' || this.state === 'CONNECTING') {
        this.restart();
      }
    }
  }

  /** Start the bridge and begin listening */
  public start(): void {
    this.isStopped = false;
    this.connect();
  }

  /** Stop the bridge and cancel reconnect timers */
  public stop(): void {
    this.isStopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupPort();
    this.state = 'DISCONNECTED';
    console.log('[RFID Serial] Bridge stopped cleanly.');
  }

  /** Restart the serial connection */
  public restart(): void {
    this.cleanupPort();
    this.connect();
  }

  /** Lists all serial/COM ports currently recognized by the operating system */
  public static async listAvailablePorts() {
    try {
      const { SerialPort } = await getSerialPortLibs();
      if (!SerialPort) return [];
      const ports = await SerialPort.list();
      return ports.map((p: any) => ({
        path: p.path,
        manufacturer: p.manufacturer || 'Unknown',
        serialNumber: p.serialNumber || 'Unknown',
        vendorId: p.vendorId || 'Unknown',
        productId: p.productId || 'Unknown',
        friendlyName: p.friendlyName || '',
      }));
    } catch (err) {
      console.warn('[RFID Serial] Failed to enumerate ports:', err);
      return [];
    }
  }

  private async connect(): Promise<void> {
    if (this.isStopped) return;

    this.state = 'CONNECTING';

    try {
      const { SerialPort, ReadlineParser } = await getSerialPortLibs();
      if (!SerialPort || !ReadlineParser) {
        console.log('[RFID Serial] Hardware serial port driver unavailable in this environment (Cloud/Serverless mode). Hardware RFID listener skipped.');
        this.state = 'DISCONNECTED';
        return;
      }

      try {
        const ports = await RfidSerialBridge.listAvailablePorts();
        const ch340OrArduino = ports.find(
          (p: any) => (p.friendlyName && /CH340|Arduino|USB-SERIAL/i.test(p.friendlyName)) ||
                 (p.manufacturer && /wch|arduino/i.test(p.manufacturer)) ||
                 (p.vendorId && /1a86/i.test(p.vendorId))
        );
        if (ch340OrArduino && ch340OrArduino.path) {
          this.portPath = ch340OrArduino.path;
        }
      } catch {}

      console.log(`[RFID Serial] Attempting connection on ${this.portPath} at ${this.baudRate} baud...`);

      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
        autoOpen: false,
      });

      // Crucial: Register error listener BEFORE open to prevent unhandled Node error events
      this.port.on('error', (err: Error) => {
        console.warn(`[RFID Serial] Port error on ${this.portPath}: ${err.message}`);
        this.handleDisconnect();
      });

      this.port.on('open', () => {
        this.state = 'CONNECTED';
        console.log(`[RFID Serial] Successfully connected to Arduino Nano on ${this.portPath}`);

        try {
          wsHub.broadcast({
            type: 'HARDWARE_STATUS_CHANGED',
            payload: {
              deviceCode: this.deviceCode,
              status: DeviceStatus.CONNECTED,
              timestamp: new Date().toISOString(),
            },
          });
        } catch {}

        if (this.customOnStatusChange) {
          this.customOnStatusChange('CONNECTED', this.portPath);
        } else {
          console.log([
            '\n================================',
            'RFID READER CONNECTED',
            '==================',
            `Port: ${this.portPath}`,
            `Baud: ${this.baudRate}`,
            'Ready to scan cards...',
            '================================\n',
          ].join('\n'));
        }

        this.parser = this.port!.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.parser.on('data', (rawLine: string) => {
          this.handleSerialLine(rawLine);
        });
      });

      this.port.on('close', () => {
        console.warn(`[RFID Serial] Connection on ${this.portPath} was closed.`);
        this.handleDisconnect();
      });

      this.port.open((err: any) => {
        if (err) {
          console.warn(`[RFID Serial] Could not open ${this.portPath}: ${err.message}`);
          this.handleDisconnect();
        }
      });
    } catch (err: any) {
      console.warn(`[RFID Serial] Failed to initialize port ${this.portPath}: ${err.message}`);
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    const wasConnected = this.state === 'CONNECTED';
    this.cleanupPort();

    if (this.isStopped) return;

    this.state = 'RECONNECTING';

    try {
      wsHub.broadcast({
        type: 'HARDWARE_STATUS_CHANGED',
        payload: {
          deviceCode: this.deviceCode,
          status: DeviceStatus.OFFLINE,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {}

    if (wasConnected) {
      if (this.customOnStatusChange) {
        this.customOnStatusChange('RECONNECTING', this.portPath);
      } else {
        console.log([
          '\n================================',
          'RFID READER DISCONNECTED',
          '==================',
          `Port: ${this.portPath}`,
          'Waiting for reader to reconnect...',
          '================================\n',
        ].join('\n'));
      }
    }

    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(async () => {
        this.reconnectTimer = null;
        try {
          const ports = await RfidSerialBridge.listAvailablePorts();
          const ch340 = ports.find(
            (p: any) => (p.friendlyName && /CH340|Arduino/i.test(p.friendlyName)) ||
                   (p.manufacturer && /wch|arduino/i.test(p.manufacturer)) ||
                   (p.vendorId && /1a86/i.test(p.vendorId))
          );
          if (ch340 && ch340.path.toUpperCase() !== this.portPath.toUpperCase()) {
            console.log(`[RFID Serial] Arduino found on ${ch340.path} (switching from ${this.portPath})`);
            this.portPath = ch340.path;
          }
        } catch {}
        this.connect();
      }, this.reconnectIntervalMs);
    }
  }

  private cleanupPort(): void {
    if (this.parser) {
      try {
        this.parser.removeAllListeners();
      } catch {}
      this.parser = null;
    }

    if (this.port) {
      try {
        this.port.removeAllListeners();
        if (this.port.isOpen) {
          this.port.close();
        }
      } catch {}
      this.port = null;
    }
  }

  /**
   * Processes raw string lines received from the Arduino USB serial buffer.
   * Expects: "RFID_SCAN:<UID>" e.g. "RFID_SCAN:73:4A:91:2C" or any standard MFRC522 UID format.
   */
  public async handleSerialLine(rawLine: string): Promise<void> {
    const line = rawLine.trim();
    if (!line) return;

    const extracted = extractUidFromLine(line);
    if (!extracted) {
      // Display diagnostic message from Arduino so user can see live serial activity
      if (!line.startsWith('===') && !line.startsWith('---')) {
        console.log(`[Arduino] ${line}`);
      }
      return;
    }

    const rawUid = extracted;
    const isValid = /^([0-9a-fA-F]{1,2}[:\s\-])+[0-9a-fA-F]{1,2}$/i.test(rawUid) ||
                    /^[0-9a-fA-F]{8,14}$/i.test(rawUid) ||
                    (/^[a-zA-Z0-9\-_]{4,32}$/.test(rawUid) && !/[!@#$%^&*()+=[\]{};'",.<>?/\\]/.test(rawUid));

    if (!isValid) {
      console.warn(`[RFID Serial] Discarding invalid UID format: "${rawUid}"`);
      return;
    }

    const normalizedUid = normalizeRfidUid(rawUid);
    if (!normalizedUid) return;

    // Debounce check: Prevent duplicate scans if tapped repeatedly within debounceMs
    const now = Date.now();
    if (this.lastScannedUid === normalizedUid && now - this.lastScannedAt < this.debounceMs) {
      // Duplicate scan within debounce window - ignore silently
      return;
    }

    this.lastScannedUid = normalizedUid;
    this.lastScannedAt = now;

    if (!this.customOnScan && process.env.RFID_DEBUG === 'true') {
      console.log(`[RFID Serial] Valid scan detected: ${normalizedUid}`);
    }

    try {
      if (this.customOnScan) {
        await this.customOnScan(normalizedUid);
      } else {
        // Query patient database / demo mappings
        const lookup = await getPatientByRfid(normalizedUid);
        if (lookup.success && lookup.patient) {
          console.log(formatRfidScanBanner({
            uid: normalizedUid,
            status: 'REGISTERED',
            patientName: lookup.patient.fullName,
          }));
        } else {
          console.log(formatRfidScanBanner({
            uid: normalizedUid,
            status: 'NOT REGISTERED',
          }));
        }

        // Ingest into existing backend pipeline
        const result = await handleRfidScan({
          deviceCode: this.deviceCode,
          uid: normalizedUid,
          timestamp: new Date().toISOString(),
          isSimulated: false,
        });
        console.log(`[RFID Serial] Intake session established: session=${result.sessionId}, patient=${result.patientId || 'NEW'}`);
      }
    } catch (err: any) {
      console.warn(`[RFID Serial] Scan processing notice for UID ${normalizedUid}: ${err.message || err}`);
    }
  }
}

// Global singleton instance for use across the application
export const rfidSerialBridge = new RfidSerialBridge();

export function startRfidSerialBridge(options?: RfidSerialBridgeOptions): RfidSerialBridge {
  const bridge = options ? new RfidSerialBridge(options) : rfidSerialBridge;
  bridge.start();
  return bridge;
}
