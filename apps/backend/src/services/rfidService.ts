import type { RfidScanResponse } from '@medikiosk/shared-types';
import { ActorType, IdentificationMethod, SessionStatus } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { wsHub } from '../ws/hub.js';

import { env } from '../lib/env.js';
import { demoStore } from '../lib/demoStore.js';

export interface RfidScanInput {
  deviceCode: string;
  uid: string;
  timestamp: string;
  /** True only for scans coming through /api/rfid/simulate - never set by the real device route. */
  isSimulated: boolean;
}

/**
 * Shared by the real ESP32 route (POST /api/rfid/scan) and the demo-only simulate route
 * (POST /api/rfid/simulate) so both paths create sessions identically. The card row is
 * looked up by its opaque UID only - it never carries patient/medical data.
 */
export async function handleRfidScan(input: RfidScanInput): Promise<RfidScanResponse> {
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

    const card = await prisma.rFIDCard.findUnique({ where: { uid: input.uid } });

    if (!card || !card.active) {
      await recordAudit({
        actorType: ActorType.DEVICE,
        actorId: device.id,
        action: 'RFID_SCAN_REJECTED',
        entityType: 'RFIDCard',
        metadata: { reason: !card ? 'UNKNOWN_UID' : 'INACTIVE_CARD' },
      });
      throw Errors.notFound('Card not recognized. Please contact the registration desk.');
    }

    const session = await prisma.patientSession.create({
      data: {
        patientId: card.patientId,
        deviceId: device.id,
        status: SessionStatus.IDENTIFIED,
        isDemo: card.isDemo,
        identifiedVia: IdentificationMethod.RFID,
      },
    });

    const isNewPatient = card.patientId === null;

    await recordAudit({
      actorType: ActorType.DEVICE,
      actorId: device.id,
      action: 'RFID_IDENTIFIED',
      entityType: 'PatientSession',
      entityId: session.id,
      metadata: { isNewPatient, isSimulated: input.isSimulated },
    });

    const response: RfidScanResponse = {
      sessionId: session.id,
      patientId: card.patientId,
      isNewPatient,
      status: isNewPatient ? 'NEW_PATIENT' : 'IDENTIFIED',
      ledColor: 'GREEN',
      buzz: true,
    };

    wsHub.broadcast({
      type: 'RFID_SCANNED',
      payload: {
        sessionId: session.id,
        uid: input.uid,
        patientId: card.patientId,
        isNewPatient,
        timestamp: new Date().toISOString(),
      },
    });

    return response;
  } catch (err: any) {
    // If database is offline and in DEMO_MODE or simulated scan, fallback to in-memory demoStore
    if (input.isSimulated || env.DEMO_MODE) {
      console.warn('[rfidService] Database offline, using in-memory demo fallback for:', input.uid);
      const demoSession = demoStore.createSession(input.uid);
      const response: RfidScanResponse = {
        sessionId: demoSession.id,
        patientId: demoSession.patientId,
        isNewPatient: false,
        status: 'IDENTIFIED',
        ledColor: 'GREEN',
        buzz: true,
      };

      wsHub.broadcast({
        type: 'RFID_SCANNED',
        payload: {
          sessionId: demoSession.id,
          uid: input.uid,
          patientId: demoSession.patientId,
          isNewPatient: false,
          timestamp: new Date().toISOString(),
        },
      });

      return response;
    }
    throw err;
  }
}
