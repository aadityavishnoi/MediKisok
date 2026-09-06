import { Router } from 'express';
import { z } from 'zod';
import type { SessionCreateResponse } from '@medikiosk/shared-types';
import { ActorType, IdentificationMethod, Language, Mode } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { recordAudit } from '../lib/audit.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const sessionRouter = Router();

const createSchema = z.object({
  mode: z.nativeEnum(Mode).optional(),
  language: z.nativeEnum(Language).optional(),
  deviceCode: z.string().optional(),
});

/** Manual/QR entry point - a session created here has no patient/RFID card attached yet. */
sessionRouter.post(
  '/session/create',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body ?? {});

    let deviceId: string | undefined;
    if (body.deviceCode) {
      const device = await prisma.rFIDDevice.findUnique({ where: { deviceCode: body.deviceCode } });
      deviceId = device?.id;
    }

    const session = await prisma.patientSession.create({
      data: {
        mode: body.mode ?? Mode.GENERAL,
        language: body.language ?? Language.EN,
        deviceId,
        identifiedVia: IdentificationMethod.MANUAL,
      },
    });

    await recordAudit({
      actorType: ActorType.PATIENT,
      action: 'SESSION_CREATED',
      entityType: 'PatientSession',
      entityId: session.id,
      metadata: { identifiedVia: 'MANUAL' },
    });

    const response: SessionCreateResponse = { sessionId: session.id, status: session.status };
    res.status(201).json(response);
  }),
);
