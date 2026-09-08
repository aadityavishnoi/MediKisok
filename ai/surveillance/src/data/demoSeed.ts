/**
 * Developer 2: Controlled Region X 8/10 Outbreak Demo Seed
 *
 * Provides a canonical seed scenario:
 * Region: REGION_X (e.g. Varanasi District / Sentinel Kiosks)
 * Screened: 10
 * Positive: 8
 * Observed Positivity: 80% (0.80)
 * Risk Level: CRITICAL
 * Confidence: LOW_SAMPLE
 *
 * Purpose: Demonstrates small-sample uncertainty handling, wide Wilson CI [49%-94%],
 * and Bayesian smoothing to prevent treating small cluster observations as individual diagnostic certainty.
 */
import {
  BayesianOutbreakEstimator,
  type OutbreakCalculationResult,
} from '../BayesianOutbreakEstimator';
import type { RawSurveillanceRecord, NormalizedSurveillanceSignal } from './SurveillanceNormalizer';
import { SurveillanceNormalizer } from './SurveillanceNormalizer';

export const REGION_X_RAW_DEMO_RECORDS: RawSurveillanceRecord[] = [
  {
    source: 'KIOSK_TRIAGE',
    regionId: 'REGION_X',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    hospitalId: 'HOSP_BHU_VARANASI',
    diseaseRaw: 'COVID-19',
    screenedCount: 4,
    positiveCount: 3,
    reportedDate: new Date().toISOString(),
    notes: 'Pre-consultation intake kiosk acute fever cluster',
  },
  {
    source: 'HOSPITAL_SENTINEL',
    regionId: 'REGION_X',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    hospitalId: 'HOSP_DISTRICT_CIVIL',
    diseaseRaw: 'SARS-CoV-2',
    screenedCount: 6,
    positiveCount: 5,
    reportedDate: new Date().toISOString(),
    notes: 'Rapid antigen emergency triage sentinel intake',
  },
];

export class DemoSeedManager {
  /**
   * Generates normalized signals for the 8/10 Demo cluster
   */
  static getNormalizedDemoSignals(): NormalizedSurveillanceSignal[] {
    return this.getRawDemoRecords().map((r) => SurveillanceNormalizer.normalizeRecord(r));
  }

  static getRawDemoRecords(): RawSurveillanceRecord[] {
    return REGION_X_RAW_DEMO_RECORDS;
  }

  /**
   * Generates the authoritative 8/10 Outbreak Assessment
   */
  static getRegionXDemoAssessment(): OutbreakCalculationResult {
    return BayesianOutbreakEstimator.assessRegionalRisk({
      regionId: 'REGION_X',
      disease: 'COVID-19',
      testedCount: 10,
      positiveCount: 8,
      baselinePrevalence: 0.04,
      priorAlpha: 2,
      priorBeta: 48,
    });
  }
}
