import { Router } from 'express';
import { z } from 'zod';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireDeviceKey } from '../middleware/deviceAuth.js';
import { handleRfidScan } from '../services/rfidService.js';

export const rfidRouter = Router();

const scanSchema = z.object({
  deviceCode: z.string().min(1),
  uid: z.string().min(1),
  timestamp: z.string().min(1),
});

rfidRouter.post(
  '/rfid/scan',
  requireDeviceKey,
  asyncHandler(async (req, res) => {
    const body = scanSchema.parse(req.body);
    const result = await handleRfidScan({ ...body, isSimulated: false });
    res.status(200).json(result);
  }),
);

const simulateSchema = z.object({
  uid: z.string().min(1).default('DEMO-RFID-001'),
});

rfidRouter.post(
  '/rfid/simulate',
  asyncHandler(async (req, res, next) => {
    if (!env.DEMO_MODE) {
      next(Errors.notFound());
      return;
    }
    const body = simulateSchema.parse(req.body ?? {});
    const result = await handleRfidScan({
      deviceCode: 'DEMO-KIOSK-01',
      uid: body.uid,
      timestamp: new Date().toISOString(),
      isSimulated: true,
    });
    res.status(200).json(result);
  }),
);
