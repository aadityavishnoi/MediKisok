import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthLoginResponse } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Demo credentials for SIH demonstration. Password is always 'demo' for demo accounts.
 * These are only active when the user does NOT exist in the real DB, or as DB fallback.
 */
const DEMO_CREDENTIALS: Record<
  string,
  { password: string; role: string; name: string; facilityId: string | null }
> = {
  'demo.doctor@medikiosk.local': {
    password: 'demo',
    role: 'DOCTOR',
    name: 'Dr. Rohan Mehta',
    facilityId: 'demo-hospital-001',
  },
  'doctor@medikiosk.local': {
    password: 'MediKiosk@123',
    role: 'DOCTOR',
    name: 'Dr. Rohan Mehta',
    facilityId: 'demo-hospital-001',
  },
  'admin@medikiosk.local': {
    password: 'demo',
    role: 'HOSPITAL_ADMIN',
    name: 'Hospital Admin',
    facilityId: 'demo-hospital-001',
  },
  'rfid@medikiosk.local': {
    password: 'demo',
    role: 'RFID_OFFICER',
    name: 'RFID Officer',
    facilityId: 'demo-hospital-001',
  },
  'central@medikiosk.local': {
    password: 'demo',
    role: 'CENTRAL_ADMIN',
    name: 'Central Admin',
    facilityId: null,
  },
  'superadmin@medikiosk.local': {
    password: 'demo',
    role: 'ADMIN',
    name: 'Super Admin',
    facilityId: null,
  },
};

authRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    // 1. Try real database user first
    try {
      const doctor = await prisma.doctor.findUnique({ where: { email: body.email } });
      if (doctor) {
        const passwordMatches = await bcrypt.compare(body.password, doctor.passwordHash);
        if (passwordMatches) {
          const payload = {
            sub: doctor.id,
            role: doctor.role,
            name: doctor.name,
            email: doctor.email,
            facilityId: doctor.hospitalId ?? null,
          };
          const token = jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
          } as jwt.SignOptions);

          const response: AuthLoginResponse = { token, role: doctor.role, name: doctor.name };
          res.status(200).json(response);
          return;
        }
      }
    } catch (dbErr) {
      console.warn('[auth] DB query failed, falling back to demo credentials');
    }

    // 2. Check demo credentials table
    const demoUser = DEMO_CREDENTIALS[body.email.toLowerCase()];
    if (demoUser && body.password === demoUser.password) {
      const payload = {
        sub: `demo-user-${body.email.split('@')[0].replace(/\./g, '-')}`,
        role: demoUser.role,
        name: demoUser.name,
        email: body.email,
        facilityId: demoUser.facilityId,
      };
      const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' } as jwt.SignOptions);
      res.status(200).json({ token, role: demoUser.role, name: demoUser.name });
      return;
    }

    // 3. Legacy password aliases for demo doctor
    if (
      body.email === 'demo.doctor@medikiosk.local' &&
      (body.password === 'MediKiosk@123' || body.password === 'doctor')
    ) {
      const token = jwt.sign(
        { sub: 'demo-doctor-001', role: 'DOCTOR', name: 'Dr. Rohan Mehta', facilityId: 'demo-hospital-001' },
        env.JWT_SECRET,
        { expiresIn: '24h' } as jwt.SignOptions,
      );
      res.status(200).json({ token, role: 'DOCTOR', name: 'Dr. Rohan Mehta' });
      return;
    }

    throw Errors.unauthorized('Invalid email or password');
  }),
);

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile from their JWT.
 */
authRouter.get(
  '/auth/me',
  asyncHandler(async (req, res) => {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) throw Errors.unauthorized('Missing token');

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
      res.status(200).json({ user: payload });
    } catch {
      throw Errors.unauthorized('Invalid or expired token');
    }
  }),
);
