import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { Errors } from '../lib/errors.js';
import { wsHub } from '../ws/hub.js';
import { ActorType, IdentificationMethod, SessionStatus } from '@medikiosk/shared-types';
import { recordAudit } from '../lib/audit.js';
import { normalizeRfidUid } from '../services/rfidService.js';

const db = prisma as any;

export const patientRegistrationRouter = Router();

const registerKioskPatientSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  age: z.number().int().min(1).max(120).optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  abhaId: z.string().optional(),
  rfidUid: z.string().optional(),
  deviceCode: z.string().default('DEMO-KIOSK-01'),
});

patientRegistrationRouter.post(
  '/patients/register-kiosk',
  asyncHandler(async (req, res) => {
    const data = registerKioskPatientSchema.parse(req.body);
    const cleanPhone = data.phone.replace(/\D/g, '').slice(-10);

    // 1. Generate or normalize provided RFID Card UID
    const assignedUid = data.rfidUid && data.rfidUid.trim() !== ''
      ? normalizeRfidUid(data.rfidUid.trim()) || data.rfidUid.trim()
      : `RFID-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // 2. Ensure device exists
    const device = await db.rFIDDevice.upsert({
      where: { deviceCode: data.deviceCode },
      update: { lastHeartbeatAt: new Date() },
      create: {
        deviceCode: data.deviceCode,
        isDemo: true,
        lastHeartbeatAt: new Date(),
      },
    });

    // 3. Upsert patient by phone
    const patient = await db.patient.upsert({
      where: { phone: cleanPhone },
      update: {
        fullName: data.fullName,
        age: data.age,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        abhaId: data.abhaId,
      },
      create: {
        fullName: data.fullName,
        phone: cleanPhone,
        age: data.age,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        abhaId: data.abhaId || `ABHA-91-${cleanPhone.slice(0, 4)}-${cleanPhone.slice(4)}`,
        registrationSource: IdentificationMethod.RFID,
        isDemo: true,
      },
    });

    // 4. Bind / Upsert RFID Card
    await db.rFIDCard.upsert({
      where: { uid: assignedUid },
      update: {
        patientId: patient.id,
        cardStatus: 'ACTIVE',
        active: true,
        issuedAt: new Date(),
        cardStatusChangedAt: new Date(),
      },
      create: {
        uid: assignedUid,
        patientId: patient.id,
        cardStatus: 'ACTIVE',
        active: true,
        isDemo: true,
        issuedAt: new Date(),
        cardStatusChangedAt: new Date(),
      },
    });

    // 5. Create Patient Session
    const session = await db.patientSession.create({
      data: {
        patientId: patient.id,
        deviceId: device.id,
        status: SessionStatus.IDENTIFIED,
        isDemo: true,
        identifiedVia: IdentificationMethod.RFID,
      },
    });

    // 6. Audit log
    await recordAudit({
      actorType: ActorType.PATIENT,
      actorId: patient.id,
      action: 'PATIENT_REGISTERED_KIOSK',
      entityType: 'Patient',
      entityId: patient.id,
      metadata: { uid: assignedUid, sessionId: session.id },
    });

    // 7. Broadcast via WebSocket to kiosk and doctor dashboard
    wsHub.broadcast({
      type: 'RFID_SCANNED',
      payload: {
        sessionId: session.id,
        uid: assignedUid,
        patientId: patient.id,
        isNewPatient: false,
        isRegistered: true,
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          phone: patient.phone,
          bloodGroup: patient.bloodGroup,
          abhaId: patient.abhaId,
        },
        timestamp: new Date().toISOString(),
      },
    });

    res.status(201).json({
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString() : null,
        gender: patient.gender,
        phone: patient.phone,
        abhaId: patient.abhaId,
        registrationSource: patient.registrationSource,
        isDemo: patient.isDemo,
        createdAt: patient.createdAt.toISOString(),
        updatedAt: patient.updatedAt.toISOString(),
      },
      sessionId: session.id,
      rfidUid: assignedUid,
      status: 'IDENTIFIED',
    });
  }),
);
