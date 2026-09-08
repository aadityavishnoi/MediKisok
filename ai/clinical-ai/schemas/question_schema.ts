/**
 * MediKiosk Clinical AI - Canonical Question Schema
 */

import { z } from 'zod';
import { ClinicalCategory } from './clinical_concepts';

export type QuestionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface QuestionOption {
  value: string;
  label: string;
  isRedFlag?: boolean;
}

export interface CanonicalQuestion {
  id: string;
  text: string;
  textLocalized: {
    en: string;
    hi?: string;
  };
  category: ClinicalCategory;
  priority: QuestionPriority;
  baseScore: number;
  redFlag: boolean;
  differentialCodes: string[];
  relatedOutbreakDisease: string | null;
  clinicalRationale: string;
  relevantSymptomCodes: string[];
  options: QuestionOption[];
}

export const QuestionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  isRedFlag: z.boolean().optional(),
});

export const CanonicalQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  textLocalized: z.object({
    en: z.string(),
    hi: z.string().optional(),
  }),
  category: z.enum([
    'CONSTITUTIONAL',
    'RESPIRATORY',
    'CARDIOVASCULAR',
    'GASTROINTESTINAL',
    'NEUROLOGICAL',
    'DERMATOLOGICAL',
    'MUSCULOSKELETAL',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  baseScore: z.number().min(0).max(1),
  redFlag: z.boolean(),
  differentialCodes: z.array(z.string()),
  relatedOutbreakDisease: z.string().nullable(),
  clinicalRationale: z.string(),
  relevantSymptomCodes: z.array(z.string()),
  options: z.array(QuestionOptionSchema),
});
