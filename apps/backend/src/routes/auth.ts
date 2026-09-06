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

authRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({ where: { email: body.email } });
    if (!doctor) throw Errors.unauthorized('Invalid email or password');

    const passwordMatches = await bcrypt.compare(body.password, doctor.passwordHash);
    if (!passwordMatches) throw Errors.unauthorized('Invalid email or password');

    const token = jwt.sign({ sub: doctor.id, role: doctor.role, name: doctor.name }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const response: AuthLoginResponse = { token, role: doctor.role, name: doctor.name };
    res.status(200).json(response);
  }),
);
