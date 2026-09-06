import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireDoctorAuth } from '../middleware/doctorAuth.js';
import { getDoctorDashboard } from '../services/doctorDashboardService.js';

export const doctorRouter = Router();

doctorRouter.get(
  '/doctor/dashboard',
  requireDoctorAuth,
  asyncHandler(async (_req, res) => {
    const result = await getDoctorDashboard();
    res.status(200).json(result);
  }),
);
