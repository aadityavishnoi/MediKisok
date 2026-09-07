/**
 * TEMPORARY PHYSICAL RFID DEMO/TEST CONFIGURATION
 * 
 * Maps physical RFID card UIDs to demo patient profiles for live hardware demonstrations.
 * 
 * IMPORTANT:
 * - These are temporary in-memory demo mappings only.
 * - Does NOT modify the permanent database schema or tables.
 * - Does NOT store mappings in Arduino firmware.
 * - Software-side configuration that is easy to remove or update.
 */

export interface TemporaryRfidPatient {
  uid: string;
  patientName: string;
  id: string;
  gender: string;
  dateOfBirth: Date;
  phone?: string;
  abhaId?: string;
  chiefComplaint?: string;
}

/**
 * Temporary Physical Demo Patients Mapping
 * 1. 82:12:68:E9 -> Rudra Sandilya
 * 2. DB:F9:25:07 -> Bluetag
 * 3. 24:33:F0:06 -> White One
 */
export const TEMPORARY_PHYSICAL_RFID_PATIENTS: Record<string, TemporaryRfidPatient> = {
  '82:12:68:E9': {
    uid: '82:12:68:E9',
    patientName: 'Rudra Sandilya',
    id: 'demo-phys-001',
    gender: 'Male',
    dateOfBirth: new Date('1995-05-15'),
    phone: '9876543210',
    abhaId: '91-8212-6800-0001',
    chiefComplaint: 'General Health Checkup',
  },
  'DB:F9:25:07': {
    uid: 'DB:F9:25:07',
    patientName: 'Bluetag',
    id: 'demo-phys-002',
    gender: 'Other',
    dateOfBirth: new Date('2000-01-01'),
    phone: '9876543211',
    abhaId: '91-0000-2507-0002',
    chiefComplaint: 'Demo Intake Consultation',
  },
  '24:33:F0:06': {
    uid: '24:33:F0:06',
    patientName: 'White One',
    id: 'demo-phys-003',
    gender: 'Other',
    dateOfBirth: new Date('2000-01-01'),
    phone: '9876543212',
    abhaId: '91-2433-0006-0003',
    chiefComplaint: 'Routine Clinical History',
  },
};

/**
 * Looks up temporary demo patient by RFID UID (handles case-insensitivity and delimiters).
 */
export function getTemporaryDemoPatient(rawUid: string): TemporaryRfidPatient | undefined {
  if (!rawUid) return undefined;
  const trimmed = rawUid.trim().toUpperCase();

  // Direct lookup
  if (TEMPORARY_PHYSICAL_RFID_PATIENTS[trimmed]) {
    return TEMPORARY_PHYSICAL_RFID_PATIENTS[trimmed];
  }

  // Check colon-separated normalization (e.g. "82-12-68-e9" or "821268e9" -> "82:12:68:E9")
  const formatted = trimmed.includes(':') || trimmed.includes('-') || trimmed.includes(' ')
    ? trimmed.split(/[:\s\-]+/).map((b) => b.padStart(2, '0')).join(':')
    : (trimmed.match(/.{1,2}/g) || []).join(':');

  return TEMPORARY_PHYSICAL_RFID_PATIENTS[formatted];
}
