/**
 * Developer 2: Regional Disease Surveillance Aggregator
 * Groups normalized surveillance signals across facilities and districts to compute
 * rolling temporal trends, facility clustering, and Bayesian risk estimations.
 */
import type { NormalizedSurveillanceSignal } from '../data/SurveillanceNormalizer';
import {
  BayesianOutbreakEstimator,
  type OutbreakCalculationResult,
} from '../BayesianOutbreakEstimator';

export interface RegionalAggregationResult {
  regionId: string;
  state: string;
  district: string;
  disease: string;
  icd10Code: string;
  category: string;
  reportingFacilitiesCount: number;
  facilityIds: string[];
  totalScreened: number;
  totalPositives: number;
  observedPositivityRate: number;
  bayesianEstimate: OutbreakCalculationResult;
  temporalWindow: '24H' | '7D' | '14D' | 'CUSTOM';
  periodStart?: string;
  periodEnd?: string;
}

export class RegionalAggregator {
  /**
   * Aggregates normalized surveillance records for a given regional cohort and disease.
   */
  static aggregateCohort(
    signals: NormalizedSurveillanceSignal[],
    previousPeriodSignals: NormalizedSurveillanceSignal[] = [],
    window: '24H' | '7D' | '14D' | 'CUSTOM' = '7D',
  ): RegionalAggregationResult[] {
    // Filter valid signals only
    const valid = signals.filter((s) => s.isValid);

    // Group by regionId + disease
    const groups = new Map<string, NormalizedSurveillanceSignal[]>();
    for (const s of valid) {
      const key = `${s.regionId}::${s.disease}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(s);
    }

    // Previous period map for rolling trend calculation
    const prevMap = new Map<string, { screened: number; positives: number }>();
    for (const p of previousPeriodSignals.filter((s) => s.isValid)) {
      const key = `${p.regionId}::${p.disease}`;
      if (!prevMap.has(key)) {
        prevMap.set(key, { screened: 0, positives: 0 });
      }
      const entry = prevMap.get(key)!;
      entry.screened += p.screenedCount;
      entry.positives += p.positiveCount;
    }

    const results: RegionalAggregationResult[] = [];

    for (const [key, cohort] of groups.entries()) {
      const [regionId, disease] = key.split('::');
      const first = cohort[0];

      let totalScreened = 0;
      let totalPositives = 0;
      const facilities = new Set<string>();

      for (const item of cohort) {
        totalScreened += item.screenedCount;
        totalPositives += item.positiveCount;
        if (item.hospitalId) {
          facilities.add(item.hospitalId);
        }
      }

      const prev = prevMap.get(key);

      // Compute Bayesian outbreak statistics with Wilson confidence intervals
      const bayesianEstimate = BayesianOutbreakEstimator.assessRegionalRisk({
        regionId,
        disease,
        testedCount: totalScreened,
        positiveCount: totalPositives,
        previousPeriodTested: prev?.screened,
        previousPeriodPositive: prev?.positives,
      });

      results.push({
        regionId,
        state: first.state,
        district: first.district,
        disease,
        icd10Code: first.icd10Code,
        category: first.category,
        reportingFacilitiesCount: facilities.size,
        facilityIds: Array.from(facilities),
        totalScreened,
        totalPositives,
        observedPositivityRate: totalScreened > 0 ? Number((totalPositives / totalScreened).toFixed(4)) : 0,
        bayesianEstimate,
        temporalWindow: window,
      });
    }

    return results;
  }
}
