import type { RfidScanResponse } from '@medikiosk/shared-types';
import { ActorType, IdentificationMethod, SessionStatus } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { wsHub } from '../ws/hub.js';

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
};

/**
 * Shared by the real ESP32/Arduino route (POST /api/rfid/scan) and the demo-only simulate route
 * (POST /api/rfid/simulate) so both paths create sessions identically. The card row is
 * looked up by its opaque UID only - it never carries patient/medical data.
 */
export async function handleRfidScan(input: RfidScanInput): Promise<RfidScanResponse> {
  const normalizedUid = normalizeRfidUid(input.uid) || input.uid;
  let deviceId = 'device-001';

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
  } catch {}

  let card: any = null;

  // 1. Check CockroachDB for real registered card
  try {
    card = await prisma.rFIDCard.findFirst({
      where: {
        OR: [
          { uid: normalizedUid },
          { uid: input.uid },
          { uid: input.uid.toUpperCase() },
        ],
        active: true,
      },
      include: {
        patient: true,
      },
    });
  } catch (err) {
    console.warn('[handleRfidScan] Database lookup notice:', err);
  }

  // 2. If not found in DB and it's a simulated demo scan, check DEMO_PATIENTS_MAP
  if (!card && input.isSimulated && env.DEMO_MODE) {
    const demo = DEMO_PATIENTS_MAP[input.uid] || DEMO_PATIENTS_MAP[normalizedUid];
    if (demo) {
      card = {
        uid: demo.uid,
        patientId: demo.id,
        isDemo: true,
        active: true,
        patient: {
          id: demo.id,
          fullName: demo.fullName,
          dateOfBirth: demo.dateOfBirth,
          gender: demo.gender,
          phone: demo.phone,
          abhaId: demo.abhaId,
          bloodGroup: 'O+',
        },
      };
    }
  }

  // 3. BLANK / UNREGISTERED CARD DETECTED
  if (!card || !card.patientId || !card.patient) {
    if (input.isSimulated) {
      throw Errors.notFound('Card not recognized. Please contact the registration desk.');
    }

    console.log(`[RFID Service] Blank/unregistered card detected: ${normalizedUid}. Notifying kiosk to initiate patient registration.`);

    try {
      await recordAudit({
        actorType: ActorType.DEVICE,
        actorId: deviceId,
        action: 'RFID_BLANK_CARD_SCANNED',
        entityType: 'RFIDCard',
        metadata: { uid: normalizedUid },
      });
    } catch {}

    // Broadcast to Kiosk & Doctor Dashboard that a blank card is ready to be bound
    wsHub.broadcast({
      type: 'RFID_SCANNED',
      payload: {
        sessionId: '',
        uid: normalizedUid,
        patientId: null,
        isNewPatient: true,
        isRegistered: false,
        message: `Blank RFID card detected (${normalizedUid}). Ready for registration.`,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      sessionId: '',
      patientId: null,
      isNewPatient: true,
      status: 'NEW_PATIENT',
      ledColor: 'YELLOW',
      buzz: true,
    };
  }

  // 4. REGISTERED PATIENT DETECTED
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
      metadata: { isNewPatient: false, isSimulated: input.isSimulated, uid: normalizedUid },
    });
  } catch (err) {
    if (!env.DEMO_MODE) console.warn('[handleRfidScan] Session create notice:', err);
  }

  const response: RfidScanResponse = {
    sessionId,
    patientId: card.patientId,
    isNewPatient: false,
    status: 'IDENTIFIED',
    ledColor: 'GREEN',
    buzz: true,
  };

  wsHub.broadcast({
    type: 'RFID_SCANNED',
    payload: {
      sessionId,
      uid: normalizedUid,
      patientId: card.patientId,
      isNewPatient: false,
      isRegistered: true,
      patient: {
        id: card.patient.id,
        fullName: card.patient.fullName,
        dateOfBirth: card.patient.dateOfBirth,
        gender: card.patient.gender,
        phone: card.patient.phone,
        abhaId: card.patient.abhaId,
        bloodGroup: card.patient.bloodGroup,
      },
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
  const normalized = normalizeRfidUid(rawUid) || rawUid;
  const skipDemo = options?.skipDemoFallback === true;

  // 1. Primary lookup: Real CockroachDB database
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
    if (!env.DEMO_MODE && !skipDemo) console.warn('[getPatientByRfid] DB query notice:', err?.message || err);
  }

  // 2. Demo fallback ONLY for synthetic unit test tokens (e.g. DEMO-RFID-001)
  if (env.DEMO_MODE && !skipDemo && (rawUid.startsWith('DEMO-RFID') || normalized.startsWith('DEMO-RFID'))) {
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


