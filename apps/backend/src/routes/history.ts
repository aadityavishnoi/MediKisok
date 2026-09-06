import { Router } from 'express';
import { z } from 'zod';
import { Mode } from '@medikiosk/shared-types';
import { CHIEF_COMPLAINT_CATEGORIES } from '@medikiosk/clinical-engine';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireConsent } from '../middleware/requireConsent.js';
import { answerHistory, startHistory } from '../services/historyService.js';

export const historyRouter = Router();

const startSchema = z.object({
  sessionId: z.string().min(1),
  mode: z.nativeEnum(Mode).default(Mode.GENERAL),
  chiefComplaintCategory: z.enum(CHIEF_COMPLAINT_CATEGORIES).or(z.string().min(1)),
});

historyRouter.post(
  '/history/start',
  asyncHandler(requireConsent),
  asyncHandler(async (req, res) => {
    const body = startSchema.parse(req.body);
    const result = await startHistory(body);
    res.status(200).json(result);
  }),
);

const answerSchema = z.object({
  sessionId: z.string().min(1),
  nodeId: z.string().min(1),
  answerValue: z.unknown(),
});

historyRouter.post(
  '/history/answer',
  asyncHandler(requireConsent),
  asyncHandler(async (req, res) => {
    const body = answerSchema.parse(req.body);
    const result = await answerHistory(body);
    res.status(200).json(result);
  }),
);
