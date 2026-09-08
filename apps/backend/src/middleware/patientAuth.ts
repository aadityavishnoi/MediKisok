import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';

export interface PatientTokenPayload {
  sub: string;
  role: 'PATIENT';
  name: string;
  phone?: string | null;
  email?: string | null;
}

export type RequestWithPatient = Request & { patient?: PatientTokenPayload };

export function requirePatientAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    next(Errors.unauthorized('Missing bearer token'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as PatientTokenPayload;
    if (payload.role !== 'PATIENT') {
      next(Errors.unauthorized('Invalid patient authorization role'));
      return;
    }
    (req as RequestWithPatient).patient = payload;
    next();
  } catch {
    next(Errors.unauthorized('Invalid or expired token'));
  }
}
