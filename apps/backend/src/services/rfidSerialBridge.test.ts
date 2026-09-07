import { describe, expect, it, vi } from 'vitest';
import { normalizeRfidUid } from './rfidService.js';
import { RfidSerialBridge } from './rfidSerialBridge.js';

describe('normalizeRfidUid()', () => {
  it('converts lowercase colon-separated hex to uppercase', () => {
    expect(normalizeRfidUid('73:4a:91:2c')).toBe('73:4A:91:2C');
    expect(normalizeRfidUid('04:a7:89:bc:d1')).toBe('04:A7:89:BC:D1');
  });

  it('converts dash-separated hex to uppercase colon-separated format', () => {
    expect(normalizeRfidUid('73-4a-91-2c')).toBe('73:4A:91:2C');
    expect(normalizeRfidUid('73-4A-91-2C')).toBe('73:4A:91:2C');
  });

  it('converts unseparated 8-char or 14-char hex strings to colon-separated bytes', () => {
    expect(normalizeRfidUid('734A912C')).toBe('73:4A:91:2C');
    expect(normalizeRfidUid('734a912c')).toBe('73:4A:91:2C');
    expect(normalizeRfidUid('04a789bcd12e3f')).toBe('04:A7:89:BC:D1:2E:3F');
  });

  it('preserves and trims demo alphanumeric UIDs', () => {
    expect(normalizeRfidUid(' DEMO-RFID-001 ')).toBe('DEMO-RFID-001');
    expect(normalizeRfidUid('demo-rfid-002')).toBe('DEMO-RFID-002');
  });

  it('returns empty string for empty or blank input', () => {
    expect(normalizeRfidUid('')).toBe('');
    expect(normalizeRfidUid('   ')).toBe('');
  });
});

describe('RfidSerialBridge Serial Stream & Debounce', () => {
  it('parses RFID_SCAN lines and normalizes UID', async () => {
    const onScan = vi.fn();
    const bridge = new RfidSerialBridge({
      portPath: 'NONEXISTENT_TEST_PORT',
      debounceMs: 1500,
      onScan,
    });

    await bridge.handleSerialLine('RFID_SCAN:73:4a:91:2c');
    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('73:4A:91:2C');
  });

  it('debounces rapid duplicate scans of the same card within the debounce window', async () => {
    const onScan = vi.fn();
    const bridge = new RfidSerialBridge({
      portPath: 'NONEXISTENT_TEST_PORT',
      debounceMs: 1500,
      onScan,
    });

    // First scan
    await bridge.handleSerialLine('RFID_SCAN:73:4A:91:2C');
    expect(onScan).toHaveBeenCalledTimes(1);

    // Immediate duplicate scan (should be suppressed)
    await bridge.handleSerialLine('RFID_SCAN:73:4A:91:2C');
    expect(onScan).toHaveBeenCalledTimes(1);

    // Another immediate duplicate (should be suppressed)
    await bridge.handleSerialLine('RFID_SCAN:73:4a:91:2c');
    expect(onScan).toHaveBeenCalledTimes(1);

    // Different card scanned immediately (should be allowed through)
    await bridge.handleSerialLine('RFID_SCAN:04:A7:89:BC:D1');
    expect(onScan).toHaveBeenCalledTimes(2);
    expect(onScan).toHaveBeenLastCalledWith('04:A7:89:BC:D1');
  });

  it('parses standard Arduino MFRC522 example serial formats (Card UID, UID tag, raw hex)', async () => {
    const onScan = vi.fn();
    const bridge = new RfidSerialBridge({
      portPath: 'NONEXISTENT_TEST_PORT',
      debounceMs: 50,
      onScan,
    });

    // 1. Standard MFRC522 library "ReadNUID" format: "Card UID: 82 12 68 E9"
    await bridge.handleSerialLine('Card UID: 82 12 68 E9');
    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenLastCalledWith('82:12:68:E9');

    // Wait debounce
    await new Promise((r) => setTimeout(r, 60));

    // 2. Format: "UID tag : DB:F9:25:07"
    await bridge.handleSerialLine('UID tag : DB:F9:25:07');
    expect(onScan).toHaveBeenCalledTimes(2);
    expect(onScan).toHaveBeenLastCalledWith('DB:F9:25:07');

    // Wait debounce
    await new Promise((r) => setTimeout(r, 60));

    // 3. Raw hex format: "24:33:F0:06"
    await bridge.handleSerialLine('24:33:F0:06');
    expect(onScan).toHaveBeenCalledTimes(3);
    expect(onScan).toHaveBeenLastCalledWith('24:33:F0:06');
  });

  it('gracefully ignores non-RFID lines without error', async () => {
    const onScan = vi.fn();
    const bridge = new RfidSerialBridge({
      portPath: 'NONEXISTENT_TEST_PORT',
      debounceMs: 1500,
      onScan,
    });

    await bridge.handleSerialLine('MFRC522 Initialized');
    await bridge.handleSerialLine('DEBUG: SPI clock set to 4MHz');
    await bridge.handleSerialLine('');
    await bridge.handleSerialLine('   ');

    expect(onScan).not.toHaveBeenCalled();
  });

  it('discards invalid UID malformed payloads safely', async () => {
    const onScan = vi.fn();
    const bridge = new RfidSerialBridge({
      portPath: 'NONEXISTENT_TEST_PORT',
      debounceMs: 1500,
      onScan,
    });

    await bridge.handleSerialLine('RFID_SCAN:');
    await bridge.handleSerialLine('RFID_SCAN:   ');
    await bridge.handleSerialLine('RFID_SCAN:!@#$%^&*()');

    expect(onScan).not.toHaveBeenCalled();
  });

  it('does not crash application when connecting to an unavailable port', () => {
    const bridge = new RfidSerialBridge({
      portPath: 'COM999_NON_EXISTENT_PORT',
      reconnectIntervalMs: 60000,
    });

    // Should not throw or crash
    expect(() => bridge.start()).not.toThrow();
    bridge.stop();
    expect(bridge.getState()).toBe('DISCONNECTED');
  });

  it('allows re-scanning same card after debounce window expires', async () => {
    const onScan = vi.fn();
    const bridge = new RfidSerialBridge({
      portPath: 'NONEXISTENT_TEST_PORT',
      debounceMs: 50, // Short debounce window for fast test
      onScan,
    });

    await bridge.handleSerialLine('RFID_SCAN:73:4A:91:2C');
    expect(onScan).toHaveBeenCalledTimes(1);

    // Immediate duplicate is blocked
    await bridge.handleSerialLine('RFID_SCAN:73:4A:91:2C');
    expect(onScan).toHaveBeenCalledTimes(1);

    // Wait for debounce timeout
    await new Promise((resolve) => setTimeout(resolve, 70));

    // Now re-scanning same card succeeds
    await bridge.handleSerialLine('RFID_SCAN:73:4A:91:2C');
    expect(onScan).toHaveBeenCalledTimes(2);
  });

  it('handles port path switching dynamically', () => {
    const bridge = new RfidSerialBridge({
      portPath: 'COM3',
    });
    expect(bridge.getPortPath()).toBe('COM3');
    bridge.setPortPath('COM5');
    expect(bridge.getPortPath()).toBe('COM5');
  });
});

describe('Production Physical RFID Blank Cards & Terminal Output', () => {
  it('correctly detects blank physical cards as NOT REGISTERED ready for data feeding', async () => {
    const { getPatientByRfid, formatRfidScanBanner } = await import('./rfidService.js');
    const result = await getPatientByRfid('82:12:68:E9');

    expect(result.success).toBe(false);
    expect(result.message).toBe('RFID card is not registered');

    const banner = formatRfidScanBanner({
      uid: '82:12:68:E9',
      status: 'NOT REGISTERED',
    });

    const expected = [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      'UID: 82:12:68:E9',
      'Status: NOT REGISTERED',
      '======================',
    ].join('\n');

    expect(banner).toBe(expected);
  });

  it('correctly formats terminal output for registered patient cards', async () => {
    const { formatRfidScanBanner } = await import('./rfidService.js');

    const banner = formatRfidScanBanner({
      uid: '82:12:68:E9',
      status: 'REGISTERED',
      patientName: 'Vikas Sharma',
    });

    const expected = [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      'UID: 82:12:68:E9',
      'Status: REGISTERED',
      'Patient Name: Vikas Sharma',
      '==========================',
    ].join('\n');

    expect(banner).toBe(expected);
  });

  it('formats unmapped cards as NOT REGISTERED matching expected terminal banner', async () => {
    const { getPatientByRfid, formatRfidScanBanner } = await import('./rfidService.js');
    const result = await getPatientByRfid('AA:BB:CC:DD');

    expect(result.success).toBe(false);

    const banner = formatRfidScanBanner({
      uid: 'AA:BB:CC:DD',
      status: 'NOT REGISTERED',
    });

    const expected = [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      'UID: AA:BB:CC:DD',
      'Status: NOT REGISTERED',
      '======================',
    ].join('\n');

    expect(banner).toBe(expected);
  });

  it('normalizes lowercase UIDs and space/dash-separated UIDs accurately', async () => {
    const { normalizeRfidUid } = await import('./rfidService.js');

    expect(normalizeRfidUid('82:12:68:e9')).toBe('82:12:68:E9');
    expect(normalizeRfidUid('db-f9-25-07')).toBe('DB:F9:25:07');
    expect(normalizeRfidUid('24 33 f0 06')).toBe('24:33:F0:06');
    expect(normalizeRfidUid('821268e9')).toBe('82:12:68:E9');
  });
});

