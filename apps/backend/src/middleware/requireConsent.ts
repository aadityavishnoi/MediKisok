import type { NextFunction, Request, Response } from 'express';
import { ConsentStatus } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';

/**
 * Blocks history/document/summary access until the patient has explicitly granted
 * consent for this session. Never bypassed - not even in DEMO_MODE.
 */
export async function requireConsent(req: Request, _res: Response, next: NextFunction) {
  const sessionId = (req.body?.sessionId ?? req.params?.sessionId ?? req.query?.sessionId) as string | undefined;
  if (!sessionId) {
    next(Errors.badRequest('sessionId is required'));
    return;
  }

  const consent = await prisma.consent.findUnique({ where: { sessionId } });
  if (!consent || consent.status !== ConsentStatus.GRANTED) {
    next(Errors.forbidden('Consent has not been granted for this session'));
    return;
  }

  next();
}
