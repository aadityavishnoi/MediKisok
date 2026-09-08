/**
 * MediKiosk Clinical AI - Regional Outbreak Signal Schema
 * Defines the contract for surveillance signals supplied by Developer 2.
 */

import { z } from 'zod';

export type SurveillanceRiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SurveillanceConfidence =
  | 'INSUFFICIENT_SAMPLE'
  | 'LOW_CONFIDENCE'
  | 'MODERATE_CONFIDENCE'
  | 'ADEQUATE_SAMPLE'
  | 'HIGH_CONFIDENCE'
  | 'VERY_HIGH';

export interface RegionalSignal {
  regionId?: string;
  disease: string;
  riskLevel: SurveillanceRiskLevel;
  positivityRate: number;
  sampleSize?: number;
  trend?: string;
  confidence: SurveillanceConfidence;
  generatedAt?: string;
}

export const RegionalSignalSchema = z.object({
  regionId: z.string().optional(),
  disease: z.string(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
  positivityRate: z.number().min(0).max(1),
  sampleSize: z.number().optional(),
  trend: z.string().optional(),
  confidence: z.enum([
    'INSUFFICIENT_SAMPLE',
    'LOW_CONFIDENCE',
    'MODERATE_CONFIDENCE',
    'ADEQUATE_SAMPLE',
    'HIGH_CONFIDENCE',
    'VERY_HIGH',
  ]),
  generatedAt: z.string().optional(),
});
