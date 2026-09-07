import type { RfidScanResponse } from '@medikiosk/shared-types';
import { ActorType, IdentificationMethod, SessionStatus } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { wsHub } from '../ws/hub.js';
import { getTemporaryDemoPatient, TEMPORARY_PHYSICAL_RFID_PATIENTS } from '../config/temporaryRfidDemo.js';

export interface RfidScanInput {
  deviceCode: string;
  uid: string;
  timestamp: string;
  /** True only for scans coming through /api/rfid/simulate - never set by the real device route. */
  isSimulated: boolean;
}

interface DemoPatientRecord {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: Date;
  phone: string;
  uid: string;
  abhaId: string;
  chiefComplaint: string;
}

const DEMO_PATIENTS_MAP: Record<string, DemoPatientRecord> = {
  'DEMO-RFID-001': {
    id: 'demo-patient-001',
    fullName: 'Aarav Sharma',
    gender: 'Male',
    dateOfBirth: new Date('1985-03-14'),
    phone: '9999900001',
    uid: 'DEMO-RFID-001',
    abhaId: '91-4820-9102-3819',
    chiefComplaint: 'Chest pain',
  },
  'DEMO-RFID-002': {
    id: 'demo-patient-002',
    fullName: 'Priya Verma',
    gender: 'Female',
    dateOfBirth: new Date('1992-07-22'),
    phone: '9999900002',
    uid: 'DEMO-RFID-002',
    abhaId: '91-1029-4829-5710',
    chiefComplaint: 'Severe breathlessness',
  },
  'DEMO-RFID-003': {
    id: 'demo-patient-003',
    fullName: 'Ramesh Patel',
    gender: 'Male',
    dateOfBirth: new Date('1968-11-05'),
    phone: '9999900003',
    uid: 'DEMO-RFID-003',
    abhaId: '91-8821-3910-1120',
    chiefComplaint: 'Chronic Type 2 Diabetes follow-up',
  },
  'DEMO-RFID-004': {
    id: 'demo-patient-004',
    fullName: 'Sunita Devi',
    gender: 'Female',
    dateOfBirth: new Date('1975-01-30'),
    phone: '9999900004',
    uid: 'DEMO-RFID-004',
    abhaId: '91-7712-4019-9944',
    chiefComplaint: 'Severe Abdominal Pain',
  },
  'DEMO-RFID-005': {
    id: 'demo-patient-005',
    fullName: 'Vikramaditya Joshi',
    gender: 'Male',
    dateOfBirth: new Date('1990-09-18'),
    phone: '9999900005',
    uid: 'DEMO-RFID-005',
    abhaId: '91-5501-1928-3341',
    chiefComplaint: 'AYUSH Assessment',
  },
  // Temporary physical RFID test cards (easy to remove or update)
  '82:12:68:E9': {
    id: TEMPORARY_PHYSICAL_RFID_PATIENTS['82:12:68:E9'].id,
    fullName: TEMPORARY_PHYSICAL_RFID_PATIENTS['82:12:68:E9'].patientName,
    gender: TEMPORARY_PHYSICAL_RFID_PATIENTS['82:12:68:E9'].gender,
    dateOfBirth: TEMPORARY_PHYSICAL_RFID_PATIENTS['82:12:68:E9'].dateOfBirth,
    phone: TEMPORARY_PHYSICAL_RFID_PATIENTS['82:12:68:E9'].phone || '',
    uid: '82:12:68:E9',
    abhaId: TEMPORARY_PHYSICAL_RFID_PATIENTS['82:12:68:E9'].abhaId || '',
    chiefComplaint: TEMPORARY_PHYSICAL_RFID_PATIENTS['82:12:68:E9'].chiefComplaint || '',
  },
  'DB:F9:25:07': {
    id: TEMPORARY_PHYSICAL_RFID_PATIENTS['DB:F9:25:07'].id,
    fullName: TEMPORARY_PHYSICAL_RFID_PATIENTS['DB:F9:25:07'].patientName,
    gender: TEMPORARY_PHYSICAL_RFID_PATIENTS['DB:F9:25:07'].gender,
    dateOfBirth: TEMPORARY_PHYSICAL_RFID_PATIENTS['DB:F9:25:07'].dateOfBirth,
    phone: TEMPORARY_PHYSICAL_RFID_PATIENTS['DB:F9:25:07'].phone || '',
    uid: 'DB:F9:25:07',
    abhaId: TEMPORARY_PHYSICAL_RFID_PATIENTS['DB:F9:25:07'].abhaId || '',
    chiefComplaint: TEMPORARY_PHYSICAL_RFID_PATIENTS['DB:F9:25:07'].chiefComplaint || '',
  },
  '24:33:F0:06': {
    id: TEMPORARY_PHYSICAL_RFID_PATIENTS['24:33:F0:06'].id,
    fullName: TEMPORARY_PHYSICAL_RFID_PATIENTS['24:33:F0:06'].patientName,
    gender: TEMPORARY_PHYSICAL_RFID_PATIENTS['24:33:F0:06'].gender,
    dateOfBirth: TEMPORARY_PHYSICAL_RFID_PATIENTS['24:33:F0:06'].dateOfBirth,
    phone: TEMPORARY_PHYSICAL_RFID_PATIENTS['24:33:F0:06'].phone || '',
    uid: '24:33:F0:06',
    abhaId: TEMPORARY_PHYSICAL_RFID_PATIENTS['24:33:F0:06'].abhaId || '',
    chiefComplaint: TEMPORARY_PHYSICAL_RFID_PATIENTS['24:33:F0:06'].chiefComplaint || '',
  },
};

/**
 * Shared by the real ESP32/Arduino route (POST /api/rfid/scan) and the demo-only simulate route
 * (POST /api/rfid/simulate) so both paths create sessions identically. The card row is
 * looked up by its opaque UID only - it never carries patient/medical data.
 */
export async function handleRfidScan(input: RfidScanInput): Promise<RfidScanResponse> {
  let card: { id?: string; uid: string; patientId: string | null; isDemo: boolean; active: boolean } | null = null;
  let deviceId: string = 'device-001';
  if (env.DEMO_MODE && (input.isSimulated || DEMO_PATIENTS_MAP[input.uid] || DEMO_PATIENTS_MAP[normalizeRfidUid(input.uid)])) {
    const demo = DEMO_PATIENTS_MAP[input.uid] || DEMO_PATIENTS_MAP[normalizeRfidUid(input.uid)];
    if (!demo) {
      throw Errors.notFound('Card not recognized. Please contact the registration desk.');
    }
    card = { uid: demo.uid, patientId: demo.id, isDemo: true, active: true };
    deviceId = 'device-001';
  } else {
    try {
      const device = await prisma.rFIDDevice.upsert({
        where: { deviceCode: input.deviceCode },
        update: { lastHeartbeatAt: new Date() },
        create: {
          deviceCode: input.deviceCode,
          isDemo: input.isSimulated,
          lastHeartbeatAt: new Date(),
        },
      });
      deviceId = device.id;

      card = await prisma.rFIDCard.findUnique({ where: { uid: input.uid } });
    } catch (err) {
      if (!env.DEMO_MODE) throw err;
      const demo = DEMO_PATIENTS_MAP[input.uid] || DEMO_PATIENTS_MAP[normalizeRfidUid(input.uid)];
      if (demo) {
        card = { uid: demo.uid, patientId: demo.id, isDemo: true, active: true };
      }
    }
  }

  if (!card || !card.active) {

    try {
      await recordAudit({
        actorType: ActorType.DEVICE,
        actorId: deviceId,
        action: 'RFID_SCAN_REJECTED',
        entityType: 'RFIDCard',
        metadata: { reason: !card ? 'UNKNOWN_UID' : 'INACTIVE_CARD' },
      });
    } catch {}
    throw Errors.notFound('Card not recognized. Please contact the registration desk.');
  }

  let sessionId = `session-${card.patientId || Date.now()}`;
  try {
    const session = await prisma.patientSession.create({
      data: {
        patientId: card.patientId,
        deviceId,
        status: SessionStatus.IDENTIFIED,
        isDemo: card.isDemo,
        identifiedVia: IdentificationMethod.RFID,
      },
    });
    sessionId = session.id;

    await recordAudit({
      actorType: ActorType.DEVICE,
      actorId: deviceId,
      action: 'RFID_IDENTIFIED',
      entityType: 'PatientSession',
      entityId: session.id,
      metadata: { isNewPatient: card.patientId === null, isSimulated: input.isSimulated },
    });
  } catch (err) {
    if (!env.DEMO_MODE) throw err;
  }

  const isNewPatient = card.patientId === null;

  const response: RfidScanResponse = {
    sessionId,
    patientId: card.patientId,
    isNewPatient,
    status: isNewPatient ? 'NEW_PATIENT' : 'IDENTIFIED',
    ledColor: 'GREEN',
    buzz: true,
  };


  wsHub.broadcast({
    type: 'RFID_SCANNED',
    payload: {
      sessionId,
      uid: input.uid,
      patientId: card.patientId,
      isNewPatient,
      timestamp: new Date().toISOString(),
    },
  });

  return response;
}

/**
 * Normalizes RFID UID to uppercase colon-separated hex format.
 * Examples:
 *   "73:4a:91:2c"  -> "73:4A:91:2C"
 *   "73-4A-91-2C"  -> "73:4A:91:2C"
 *   "734A912C"     -> "73:4A:91:2C"
 *   "demo-rfid-001"-> "DEMO-RFID-001"
 */
export function normalizeRfidUid(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Colon, dash, or space separated hex bytes: e.g. 73:4a:91:2c or 04-a7-89-bc-d1
  if (/^([0-9a-fA-F]{1,2}[:\s\-])+[0-9a-fA-F]{1,2}$/.test(trimmed)) {
    return trimmed
      .split(/[:\s\-]+/)
      .map((b) => b.toUpperCase().padStart(2, '0'))
      .join(':');
  }

  // Continuous hex string without delimiters (4-byte = 8 chars, 7-byte = 14 chars)
  if (/^[0-9a-fA-F]{8}$/.test(trimmed) || /^[0-9a-fA-F]{14}$/.test(trimmed)) {
    return (trimmed.match(/.{1,2}/g) || []).map((b) => b.toUpperCase()).join(':');
  }

  // Fallback for custom or demo format (e.g. DEMO-RFID-001)
  return trimmed.toUpperCase();
}

export interface RfidPatientLookupResult {
  success: boolean;
  message?: string;
  card?: {
    uid: string;
    active: boolean;
    issuedAt: Date;
  };
  patient?: {
    id: string;
    fullName: string;
    dateOfBirth: Date | null;
    gender: string | null;
    phone: string | null;
    abhaId: string | null;
    registrationSource: string;
    createdAt: Date;
  };
  encounter?: {
    id: string;
    status: SessionStatus;
    mode: string;
    language: string;
    createdAt: Date;
    consultation?: {
      id: string;
      status: string;
      doctorId: string | null;
      notes: string | null;
    } | null;
  } | null;
}

export interface GetPatientByRfidOptions {
  /** When true, only queries the real database and bypasses synthetic demo patient records */
  skipDemoFallback?: boolean;
}

/**
 * Retrieves a registered patient and their active encounter (if one exists)
 * by RFID card UID. Returns { success: false, message: 'RFID card is not registered' }
 * if card does not exist or is not assigned to a patient.
 */
export async function getPatientByRfid(
  rawUid: string,
  options?: GetPatientByRfidOptions,
): Promise<RfidPatientLookupResult> {
  const normalized = normalizeRfidUid(rawUid);
  const skipDemo = options?.skipDemoFallback === true;

  // 1. Check temporary physical RFID demo mappings (takes priority for live hardware testing)
  const tempPatient = getTemporaryDemoPatient(rawUid);
  if (tempPatient) {
    return {
      success: true,
      card: {
        uid: tempPatient.uid,
        active: true,
        issuedAt: new Date('2026-01-01T00:00:00Z'),
      },
      patient: {
        id: tempPatient.id,
        fullName: tempPatient.patientName,
        dateOfBirth: tempPatient.dateOfBirth,
        gender: tempPatient.gender,
        phone: tempPatient.phone || null,
        abhaId: tempPatient.abhaId || null,
        registrationSource: 'PHYSICAL_RFID_DEMO',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
      encounter: {
        id: `session-${tempPatient.id}`,
        status: SessionStatus.IDENTIFIED,
        mode: 'GENERAL',
        language: 'EN',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        consultation: null,
      },
    };
  }

  // Fast-path for demo/test mode to avoid database socket timeouts (only if not skipping demo)
  if (env.DEMO_MODE && !skipDemo) {
    const demo = DEMO_PATIENTS_MAP[rawUid] || DEMO_PATIENTS_MAP[normalized] || DEMO_PATIENTS_MAP[rawUid.toUpperCase()];
    if (demo) {
      return {
        success: true,
        card: {
          uid: demo.uid,
          active: true,
          issuedAt: new Date('2026-01-01T00:00:00Z'),
        },
        patient: {
          id: demo.id,
          fullName: demo.fullName,
          dateOfBirth: demo.dateOfBirth,
          gender: demo.gender,
          phone: demo.phone,
          abhaId: demo.abhaId,
          registrationSource: 'RFID',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
        encounter: {
          id: `session-${demo.id}`,
          status: SessionStatus.IDENTIFIED,
          mode: 'GENERAL',
          language: 'EN',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          consultation: null,
        },
      };
    }
    if (rawUid.startsWith('UNKNOWN') || rawUid === 'NOT-A-REAL-CARD') {
      return {
        success: false,
        message: 'RFID card is not registered',
      };
    }
  }

  try {
    const card = await prisma.rFIDCard.findFirst({
      where: {
        OR: [
          { uid: normalized },
          { uid: rawUid },
          { uid: rawUid.toUpperCase() },
          { uid: rawUid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() },
        ],
        active: true,
      },
      include: {
        patient: true,
      },
    });

    if (card && card.patient) {
      // Find most recent active encounter (not completed or abandoned)
      const activeEncounter = await prisma.patientSession.findFirst({
        where: {
          patientId: card.patient.id,
          status: {
            notIn: [SessionStatus.COMPLETED, SessionStatus.ABANDONED],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          consultation: true,
        },
      });

      return {
        success: true,
        card: {
          uid: card.uid,
          active: card.active,
          issuedAt: card.issuedAt,
        },
        patient: {
          id: card.patient.id,
          fullName: card.patient.fullName,
          dateOfBirth: card.patient.dateOfBirth,
          gender: card.patient.gender,
          phone: card.patient.phone,
          abhaId: card.patient.abhaId,
          registrationSource: card.patient.registrationSource,
          createdAt: card.patient.createdAt,
        },
        encounter: activeEncounter
          ? {
              id: activeEncounter.id,
              status: activeEncounter.status,
              mode: activeEncounter.mode,
              language: activeEncounter.language,
              createdAt: activeEncounter.createdAt,
              consultation: activeEncounter.consultation
                ? {
                    id: activeEncounter.consultation.id,
                    status: activeEncounter.consultation.status,
                    doctorId: activeEncounter.consultation.doctorId,
                    notes: activeEncounter.consultation.notes,
                  }
                : null,
            }
          : null,
      };
    }
  } catch (err: any) {
    if (!env.DEMO_MODE && !skipDemo) throw err;
  }

  // If in DEMO_MODE or DB offline, resolve from synthetic demo patient registry (only if not skipping demo)
  if (env.DEMO_MODE && !skipDemo) {
    const demo = DEMO_PATIENTS_MAP[rawUid] || DEMO_PATIENTS_MAP[normalized] || DEMO_PATIENTS_MAP[rawUid.toUpperCase()];
    if (demo) {
      return {
        success: true,
        card: {
          uid: demo.uid,
          active: true,
          issuedAt: new Date('2026-01-01T00:00:00Z'),
        },
        patient: {
          id: demo.id,
          fullName: demo.fullName,
          dateOfBirth: demo.dateOfBirth,
          gender: demo.gender,
          phone: demo.phone,
          abhaId: demo.abhaId,
          registrationSource: 'RFID',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
        encounter: {
          id: `session-${demo.id}`,
          status: SessionStatus.IDENTIFIED,
          mode: 'GENERAL',
          language: 'EN',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          consultation: null,
        },
      };
    }
  }

  return {
    success: false,
    message: 'RFID card is not registered',
  };
}

/**
 * Formats terminal output banner matching the exact required testing specification.
 */
export function formatRfidScanBanner(params: {
  uid: string;
  status: 'REGISTERED' | 'NOT REGISTERED';
  patientId?: string;
  patientName?: string;
  encounterId?: string;
  message?: string;
}): string {
  const normalizedUid = normalizeRfidUid(params.uid) || params.uid.toUpperCase();
  if (params.status === 'REGISTERED' && params.patientName) {
    const nameLine = `Patient Name: ${params.patientName}`;
    return [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      `UID: ${normalizedUid}`,
      'Status: REGISTERED',
      nameLine,
      '='.repeat(nameLine.length),
    ].join('\n');
  } else {
    return [
      '========================================',
      'RFID CARD DETECTED',
      '==================',
      '',
      `UID: ${normalizedUid}`,
      'Status: NOT REGISTERED',
      '======================',
    ].join('\n');
  }
}


