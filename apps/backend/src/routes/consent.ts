import { Router } from 'express';
import { z } from 'zod';
import type { ConsentResponse } from '@medikiosk/shared-types';
import { ActorType, ConsentStatus, Language, SessionStatus } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { recordAudit } from '../lib/audit.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { wsHub } from '../ws/hub.js';

export const consentRouter = Router();

const CONSENT_TEXT_VERSION = 'v1';

const consentSchema = z.object({
  sessionId: z.string().min(1),
  granted: z.boolean(),
  language: z.nativeEnum(Language),
});

/**
 * Clinical data collection is not allowed to start without this being recorded first -
 * see middleware/requireConsent.ts, which every history/document/summary route depends on.
 */
consentRouter.post(
  '/consent',
  asyncHandler(async (req, res) => {
    const body = consentSchema.parse(req.body);

    const session = await prisma.patientSession.findUnique({ where: { id: body.sessionId } });
    if (!session) throw Errors.notFound('Session not found');

    const status = body.granted ? ConsentStatus.GRANTED : ConsentStatus.DECLINED;

    const consent = await prisma.consent.upsert({
      where: { sessionId: body.sessionId },
      update: {
        status,
        language: body.language,
        grantedAt: body.granted ? new Date() : null,
      },
      create: {
        sessionId: body.sessionId,
        status,
        language: body.language,
        consentTextVersion: CONSENT_TEXT_VERSION,
        grantedAt: body.granted ? new Date() : null,
      },
    });

    const newSessionStatus = body.granted ? SessionStatus.CONSENTED : SessionStatus.ABANDONED;
    await prisma.patientSession.update({
      where: { id: body.sessionId },
      data: { status: newSessionStatus, language: body.language },
    });

    await recordAudit({
      actorType: ActorType.PATIENT,
      action: body.granted ? 'CONSENT_GRANTED' : 'CONSENT_DECLINED',
      entityType: 'PatientSession',
      entityId: body.sessionId,
    });

    wsHub.broadcast({
      type: 'SESSION_UPDATED',
      payload: { sessionId: body.sessionId, status: newSessionStatus, timestamp: new Date().toISOString() },
    });

    const response: ConsentResponse = { consentId: consent.id, status: consent.status };
    res.status(200).json(response);
  }),
);
