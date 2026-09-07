/**
 * MediKiosk - Arduino Nano + MFRC522 Physical RFID Hardware Reader Test
 * 
 * Usage:
 *   pnpm --filter backend rfid:bridge
 *   # Or with explicit port:
 *   pnpm --filter backend rfid:bridge COM3
 */

import { RfidSerialBridge } from '../services/rfidSerialBridge.js';
import { getPatientByRfid, formatRfidScanBanner, handleRfidScan } from '../services/rfidService.js';
import { env } from '../lib/env.js';

async function main() {
  console.log('='.repeat(60));
  console.log(' MediKiosk - Physical RFID Hardware Reader Test');
  console.log('='.repeat(60));

  // 1. Detect and display available system ports
  console.log('\nScanning available COM / Serial ports...');
  const availablePorts = await RfidSerialBridge.listAvailablePorts();

  let autoDetectedPort: string | undefined;
  if (availablePorts.length === 0) {
    console.log('  [Status] No active COM ports currently detected.');
    console.log('  Connect your Arduino Nano to a USB port.');
  } else {
    console.log(`  Found ${availablePorts.length} active port(s):`);
    for (const p of availablePorts) {
      console.log(`   * ${p.path} [${p.manufacturer}] (VID: ${p.vendorId}, PID: ${p.productId})`);
    }
    const ch340OrArduino = availablePorts.find(
      (p) => (p.friendlyName && /CH340|Arduino/i.test(p.friendlyName)) ||
             (p.manufacturer && /wch|arduino/i.test(p.manufacturer)) ||
             (p.vendorId && /1a86/i.test(p.vendorId))
    );
    autoDetectedPort = ch340OrArduino ? ch340OrArduino.path : availablePorts[0].path;
  }

  // 2. Resolve port to listen to
  const cliPortArg = process.argv[2];
  let targetPort = autoDetectedPort || process.env.RFID_SERIAL_PORT || env.RFID_SERIAL_PORT || 'COM7';
  if (cliPortArg) {
    const matched = availablePorts.find((p) => p.path.toUpperCase() === cliPortArg.toUpperCase());
    if (matched) {
      targetPort = matched.path;
    } else if (autoDetectedPort) {
      console.log(`  [Notice] Port ${cliPortArg} is not active. Using auto-detected Arduino port: ${autoDetectedPort}`);
      targetPort = autoDetectedPort;
    } else {
      targetPort = cliPortArg;
    }
  }
  const targetBaud = env.RFID_SERIAL_BAUD || 9600;
  const targetDebounce = env.RFID_DEBOUNCE_MS || 1000;

  console.log(`\nConfigured Target Port: ${targetPort}${autoDetectedPort === targetPort ? ' (auto-detected)' : ''}`);
  console.log(`Baud Rate:             ${targetBaud}`);
  console.log(`Debounce Interval:     ${targetDebounce} ms`);
  console.log('-'.repeat(60));

  // Check if MediKiosk Backend server is already running and connected to this port
  try {
    const statusRes = await fetch(`http://localhost:${env.PORT || 4000}/api/rfid/status`);
    if (statusRes.ok) {
      const status = (await statusRes.json()) as any;
      if (status.connected && status.port?.toUpperCase() === targetPort.toUpperCase()) {
        console.log('\n============================================================');
        console.log(` [MediKiosk] Port ${targetPort} is ALREADY CONNECTED & ACTIVE in Backend!`);
        console.log(' Physical card taps are read directly by the backend server.');
        console.log(' WebSocket events are actively streaming to the Patient Kiosk.');
        console.log('============================================================\n');
        console.log('Ready! Tap your RFID card on the reader antenna at any time.\n');
        // Keep alive so user terminal stays open
        setInterval(() => {}, 30000);
        return;
      }
    }
  } catch {}

  console.log('Starting RFID listener... Tap an RFID card on the MFRC522 reader.\n');

  // 3. Start bridge with exact required physical test formatting
  const bridge = new RfidSerialBridge({
    portPath: targetPort,
    baudRate: targetBaud,
    debounceMs: targetDebounce,
    onStatusChange: (state, port) => {
      if (state === 'CONNECTED') {
        console.log([
          '\n================================',
          'RFID READER CONNECTED',
          '==================',
          `Port: ${port}`,
          `Baud: ${targetBaud}`,
          'Ready to scan cards...',
          '================================\n',
        ].join('\n'));
      } else if (state === 'RECONNECTING' || state === 'DISCONNECTED') {
        console.log([
          '\n================================',
          'RFID READER DISCONNECTED',
          '==================',
          `Port: ${port}`,
          'Waiting for reader to reconnect...',
          '================================\n',
        ].join('\n'));
      }
    },
    onScan: async (uid) => {
      try {
        const lookup = await getPatientByRfid(uid);

        if (lookup.success && lookup.patient) {
          console.log(formatRfidScanBanner({
            uid,
            status: 'REGISTERED',
            patientName: lookup.patient.fullName,
          }));
        } else {
          console.log(formatRfidScanBanner({
            uid,
            status: 'NOT REGISTERED',
          }));
        }

        // 1. Process directly in-process
        await handleRfidScan({
          deviceCode: 'KIOSK-DEV-001',
          uid,
          timestamp: new Date().toISOString(),
          isSimulated: false,
        });

        // 2. Also forward to running backend HTTP server on port 4000 if active
        try {
          await fetch(`http://localhost:${env.PORT || 4000}/api/rfid/scan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Device-Key': env.DEVICE_KEY || 'dev-device-key-change-in-production',
            },
            body: JSON.stringify({
              deviceCode: 'KIOSK-DEV-001',
              uid,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch {
          // Dev server might be the same process or offline
        }
      } catch (err: any) {
        console.log(formatRfidScanBanner({
          uid,
          status: 'NOT REGISTERED',
        }));
      }
      console.log('');
    },
  });

  bridge.start();

  // Handle termination signals
  process.on('SIGINT', () => {
    console.log('\nStopping RFID hardware test...');
    bridge.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    bridge.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal bridge error:', err);
  process.exit(1);
});
