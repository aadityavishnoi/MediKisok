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

describe('Temporary Physical RFID Demo Cards & Terminal Output', () => {
  it('correctly maps and formats UID 82:12:68:E9 to Rudra Sandilya', async () => {
    const { getPatientByRfid, formatRfidScanBanner } = await import('./rfidService.js');
    const result = await getPatientByRfid('82:12:68:E9');

    expect(result.success).toBe(true);
    expect(result.patient?.fullName).toBe('Rudra Sandilya');

    const banner = formatRfidScanBanner({
      uid: '82:12:68:E9',
      status: 'REGISTERED',
      patientName: result.patient?.fullName,
    });

    const expected = [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      'UID: 82:12:68:E9',
      'Status: REGISTERED',
      'Patient Name: Rudra Sandilya',
      '============================',
    ].join('\n');

    expect(banner).toBe(expected);
  });

  it('correctly maps and formats UID DB:F9:25:07 to Bluetag', async () => {
    const { getPatientByRfid, formatRfidScanBanner } = await import('./rfidService.js');
    const result = await getPatientByRfid('DB:F9:25:07');

    expect(result.success).toBe(true);
    expect(result.patient?.fullName).toBe('Bluetag');

    const banner = formatRfidScanBanner({
      uid: 'DB:F9:25:07',
      status: 'REGISTERED',
      patientName: result.patient?.fullName,
    });

    const expected = [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      'UID: DB:F9:25:07',
      'Status: REGISTERED',
      'Patient Name: Bluetag',
      '=====================',
    ].join('\n');

    expect(banner).toBe(expected);
  });

  it('correctly maps and formats UID 24:33:F0:06 to White One', async () => {
    const { getPatientByRfid, formatRfidScanBanner } = await import('./rfidService.js');
    const result = await getPatientByRfid('24:33:F0:06');

    expect(result.success).toBe(true);
    expect(result.patient?.fullName).toBe('White One');

    const banner = formatRfidScanBanner({
      uid: '24:33:F0:06',
      status: 'REGISTERED',
      patientName: result.patient?.fullName,
    });

    const expected = [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      'UID: 24:33:F0:06',
      'Status: REGISTERED',
      'Patient Name: White One',
      '=======================',
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

  it('normalizes lowercase UIDs and space/dash-separated UIDs for temporary cards', async () => {
    const { getPatientByRfid } = await import('./rfidService.js');

    const res1 = await getPatientByRfid('82:12:68:e9');
    expect(res1.success).toBe(true);
    expect(res1.patient?.fullName).toBe('Rudra Sandilya');

    const res2 = await getPatientByRfid('db-f9-25-07');
    expect(res2.success).toBe(true);
    expect(res2.patient?.fullName).toBe('Bluetag');

    const res3 = await getPatientByRfid('2433F006');
    expect(res3.success).toBe(true);
    expect(res3.patient?.fullName).toBe('White One');
  });
});

