/**
 * MediKiosk Clinical AI - REST API Schemas for /api/ai/next-question
 */

import { z } from 'zod';
import { RegionalSignalSchema, RegionalSignal } from './regional_signal_schema';
import { QuestionPriority } from './question_schema';

export const NextQuestionApiRequestSchema = z.object({
  sessionId: z.string().optional(),
  patient: z.object({
    age: z.number().int().min(0).max(130),
    gender: z.string().min(1),
  }),
  symptoms: z.array(z.string()),
  answers: z.record(z.union([z.string(), z.boolean(), z.number()])),
  regionalSignals: z.array(RegionalSignalSchema).optional().default([]),
});

export type NextQuestionApiRequest = z.infer<typeof NextQuestionApiRequestSchema>;

export const NextQuestionApiResponseSchema = z.object({
  nextQuestion: z
    .object({
      id: z.string(),
      text: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    })
    .nullable(),
  reason: z.string(),
  safetyFlags: z.array(z.string()),
  requiresDoctorReview: z.literal(true),
});

export type NextQuestionApiResponse = z.infer<typeof NextQuestionApiResponseSchema>;
