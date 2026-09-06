import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireDoctorAuth, type RequestWithDoctor } from '../middleware/doctorAuth.js';
import { getDoctorDashboard, getSessionDetail } from '../services/doctorDashboardService.js';
import { acknowledgeAlert } from '../services/alertService.js';

export const doctorRouter = Router();

doctorRouter.get(
  '/doctor/dashboard',
  requireDoctorAuth,
  asyncHandler(async (_req, res) => {
    const result = await getDoctorDashboard();
    res.status(200).json(result);
  }),
);

doctorRouter.get(
  '/doctor/sessions/:sessionId',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const result = await getSessionDetail(req.params.sessionId);
    res.status(200).json(result);
  }),
);

const acknowledgeSchema = z.object({ alertId: z.string().min(1) });

doctorRouter.post(
  '/doctor/alerts/:alertId/acknowledge',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const { alertId } = acknowledgeSchema.parse({ alertId: req.params.alertId });
    const doctorId = (req as RequestWithDoctor).doctor!.sub;
    const result = await acknowledgeAlert(alertId, doctorId);
    res.status(200).json(result);
  }),
);
