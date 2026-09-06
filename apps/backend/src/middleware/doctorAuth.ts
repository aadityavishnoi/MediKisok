import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';

export interface DoctorTokenPayload {
  sub: string;
  role: 'DOCTOR' | 'ADMIN';
  name: string;
}

export type RequestWithDoctor = Request & { doctor?: DoctorTokenPayload };

export function requireDoctorAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    next(Errors.unauthorized('Missing bearer token'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as DoctorTokenPayload;
    (req as RequestWithDoctor).doctor = payload;
    next();
  } catch {
    next(Errors.unauthorized('Invalid or expired token'));
  }
}
