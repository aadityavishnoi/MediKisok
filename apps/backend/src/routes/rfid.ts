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



interface LatestScanRecord {
  sessionId: string;
  patientId: string | null;
  isNewPatient: boolean;
  uid: string;
  status: string;
  timestamp: number;
}

let latestScanRecord: LatestScanRecord | null = null;

export function recordLatestScan(scan: {
  sessionId: string;
  patientId: string | null;
  isNewPatient: boolean;
  uid: string;
  status: string;
}) {
  latestScanRecord = {
    ...scan,
    timestamp: Date.now(),
  };
}

/**
 * GET /api/rfid/latest-scan
 * Polling endpoint for Kiosks running in serverless cloud where WebSockets are unavailable.
 */
rfidRouter.get('/rfid/latest-scan', (req, res) => {
  const since = Number(req.query.since || 0);
  if (latestScanRecord && latestScanRecord.timestamp > since) {
    res.status(200).json({ hasScan: true, scan: latestScanRecord });
  } else {
    res.status(200).json({ hasScan: false });
  }
});

/**
 * POST /api/rfid/trigger-scan
 * Used by Kiosk UI to trigger or forward an RFID scan (e.g. from on-screen Scan Card button).
 */
const triggerScanSchema = z
  .object({
    uid: z.string().optional(),
    cardUid: z.string().optional(),
    deviceCode: z.string().optional().default('KIOSK-DEV-001'),
  })
  .transform((data) => ({
    uid: (data.uid || data.cardUid || '').trim(),
    deviceCode: data.deviceCode || 'KIOSK-DEV-001',
  }));

rfidRouter.post(
  '/rfid/trigger-scan',
  asyncHandler(async (req, res) => {
    const body = triggerScanSchema.parse(req.body);
    const result = await handleRfidScan({
      deviceCode: body.deviceCode,
      uid: body.uid,
      timestamp: new Date().toISOString(),
      isSimulated: false,
    });
    latestScanRecord = {
      sessionId: result.sessionId,
      patientId: result.patientId,
      isNewPatient: result.isNewPatient,
      uid: body.uid,
      status: result.status,
      timestamp: Date.now(),
    };
    res.status(200).json(result);
  }),
);

rfidRouter.post(
  '/rfid/scan-card',
  asyncHandler(async (req, res) => {
    const body = triggerScanSchema.parse(req.body);
    const result = await handleRfidScan({
      deviceCode: body.deviceCode,
      uid: body.uid,
      timestamp: new Date().toISOString(),
      isSimulated: false,
    });
    latestScanRecord = {
      sessionId: result.sessionId,
      patientId: result.patientId,
      isNewPatient: result.isNewPatient,
      uid: body.uid,
      status: result.status,
      timestamp: Date.now(),
    };
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
    latestScanRecord = {
      sessionId: result.sessionId,
      patientId: result.patientId,
      isNewPatient: result.isNewPatient,
      uid: body.uid,
      status: result.status,
      timestamp: Date.now(),
    };
    res.status(200).json(result);
  }),
);

const simulateSchema = z.object({
  uid: z.string().min(1).default('DEMO-RFID-001'),
});

rfidRouter.post(
  '/rfid/simulate',
  asyncHandler(async (req, res) => {
    const body = simulateSchema.parse(req.body ?? {});
    const result = await handleRfidScan({
      deviceCode: 'DEMO-KIOSK-01',
      uid: body.uid,
      timestamp: new Date().toISOString(),
      isSimulated: true,
    });
    if (result.status === 'NEW_PATIENT') {
      throw Errors.notFound(`Card UID ${body.uid} not registered`);
    }
    latestScanRecord = {
      sessionId: result.sessionId,
      patientId: result.patientId,
      isNewPatient: result.isNewPatient,
      uid: body.uid,
      status: result.status,
      timestamp: Date.now(),
    };
    res.status(200).json(result);
  }),
);
