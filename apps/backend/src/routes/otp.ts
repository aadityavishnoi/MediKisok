import { Router } from 'express';
import { z } from 'zod';
import { OtpService } from '../services/otpService.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import type { SendOtpResponse, VerifyOtpResponse } from '@medikiosk/shared-types';

export const otpRouter = Router();

const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
});

otpRouter.post(
  '/auth/otp/send',
  asyncHandler(async (req, res) => {
    const { phone } = sendOtpSchema.parse(req.body);
    const result = await OtpService.sendOtp(phone);
    const response: SendOtpResponse = result;
    res.status(200).json(response);
  }),
);

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().min(4).max(8),
});

otpRouter.post(
  '/auth/otp/verify',
  asyncHandler(async (req, res) => {
    const { phone, code } = verifyOtpSchema.parse(req.body);
    const result = await OtpService.verifyOtp(phone, code);
    const response: VerifyOtpResponse = result;
    res.status(200).json(response);
  }),
);
