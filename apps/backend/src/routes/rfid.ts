import { Router } from 'express';
import { z } from 'zod';
import { env } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireDeviceKey } from '../middleware/deviceAuth.js';
import { handleRfidScan, getPatientByRfid } from '../services/rfidService.js';
import { rfidSerialBridge } from '../services/rfidSerialBridge.js';

export const rfidRouter = Router();

/**
 * GET /api/rfid/status
 * Get the current hardware reader connectivity and status.
 */
rfidRouter.get(
  '/rfid/status',
  asyncHandler(async (_req, res) => {
    res.status(200).json({
      connected: rfidSerialBridge.getState() === 'CONNECTED',
      state: rfidSerialBridge.getState(),
      port: rfidSerialBridge.getPortPath(),
      baudRate: env.RFID_SERIAL_BAUD,
      enabled: env.RFID_SERIAL_ENABLED,
    });
  }),
);

/**
 * GET /api/rfid/patient/:uid
 * Look up registered patient and active encounter by RFID card UID.
 */
rfidRouter.get(
  '/rfid/patient/:uid',
  asyncHandler(async (req, res) => {
    const { uid } = req.params;
    if (!uid || typeof uid !== 'string') {
      res.status(400).json({ success: false, message: 'Missing RFID UID parameter' });
      return;
    }

    const result = await getPatientByRfid(uid);
    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    res.status(200).json(result);
  }),
);



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
