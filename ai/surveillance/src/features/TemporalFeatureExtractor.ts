/**
 * Developer 2: Temporal Feature Engineering Pipeline
 *
 * Extracts multi-scale temporal dynamics, baseline deviations, and facility clustering:
 * 1. Rolling 7-day, 14-day, and 28-day incidence counts & growth rates
 * 2. Denominator-guarded observed positivity (never inferred or fabricated)
 * 3. Historical baseline statistical deviations (mean, std, z-score)
 * 4. Sentinel facility clustering metrics
 */
import type { SurveillanceObservation } from '../data/canonicalSurveillance';

export interface RegionalTemporalFeatures {
  regionId: string;
  diseaseCode: string;
  asOfDate: string;

  // Short-term incidence
  cases7d: number;
  growthRate7d: number; // (cases7d - prev7d) / prev7d
  cases14d: number;
  growthRate14d: number;

  // Medium-term incidence
  cases28d: number;
  growthRate28d: number;

  // Positivity (Strictly undefined if denominator is absent)
  totalScreened7d?: number;
  totalPositive7d?: number;
  positivityRate7d?: number;
  hasValidDenominator: boolean;

  // Historical baseline comparison
  historicalBaselineMean7d: number;
  historicalBaselineStd7d: number;
  baselineDeviationRatio: number; // cases7d / baselineMean7d
  zScore: number;                 // (cases7d - mean) / std
  isAnomalousVsBaseline: boolean;

  // Multi-facility clustering
  reportingFacilitiesCount: number;
  facilityIds: string[];
  isMultiFacilitySignal: boolean;

  observationCount: number;
}

export class TemporalFeatureExtractor {
  /**
   * Extracts temporal features from chronologically sorted valid observations.
   */
  static extractFeatures(
    observations: SurveillanceObservation[],
    referenceDateStr?: string,
  ): RegionalTemporalFeatures | null {
    const valid = observations
      .filter((o) => o.isValid)
      .sort((a, b) => new Date(a.observationDate).getTime() - new Date(b.observationDate).getTime());

    if (valid.length === 0) return null;

    const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date(valid[valid.length - 1].observationDate);
    const refMs = refDate.getTime();
    const DAY_MS = 24 * 3600 * 1000;

    const first = valid[0];
    const regionId = first.regionId;
    const diseaseCode = first.diseaseCode;

    // Temporal slices relative to refDate
    let cases7d = 0;
    let prevCases7d = 0;

    let cases14d = 0;
    let prevCases14d = 0;

    let cases28d = 0;
    let prevCases28d = 0;

    let totalScreened7d: number | undefined;
    let totalPositive7d: number | undefined;
    let screenedCountAccum = 0;
    let positiveCountAccum = 0;
    let hasScreenedRecorded = false;

    const facilities = new Set<string>();

    // Historical weekly buckets for baseline calculation (excluding the current 7d window)
    const historicalWeeklyCounts: number[] = [];
    const historicalWindowDays = 84; // 12 weeks of historical baseline
    const historicalWeeklyBuckets = new Map<number, number>();

    for (const obs of valid) {
      const obsMs = new Date(obs.observationDate).getTime();
      const diffDays = Math.floor((refMs - obsMs) / DAY_MS);

      if (diffDays < 0) {
        // Future observation relative to refDate — ignore to prevent data leakage!
        continue;
      }

      const c = obs.cases !== undefined ? obs.cases : (obs.positive !== undefined ? obs.positive : 0);

      // Current 7-day window [0, 6]
      if (diffDays >= 0 && diffDays < 7) {
        cases7d += c;
        if (obs.screened !== undefined && obs.screened > 0) {
          hasScreenedRecorded = true;
          screenedCountAccum += obs.screened;
          positiveCountAccum += (obs.positive !== undefined ? obs.positive : c);
        }
        if (obs.facilityIds && obs.facilityIds.length > 0) {
          obs.facilityIds.forEach((id) => facilities.add(id));
        } else if (obs.source) {
          facilities.add(`${obs.source}_${obs.regionId}`);
        }
      }
      // Prior 7-day window [7, 13]
      else if (diffDays >= 7 && diffDays < 14) {
        prevCases7d += c;
      }

      // Current 14-day window [0, 13]
      if (diffDays >= 0 && diffDays < 14) {
        cases14d += c;
      }
      // Prior 14-day window [14, 27]
      else if (diffDays >= 14 && diffDays < 28) {
        prevCases14d += c;
      }

      // Current 28-day window [0, 27]
      if (diffDays >= 0 && diffDays < 28) {
        cases28d += c;
      }
      // Prior 28-day window [28, 55]
      else if (diffDays >= 28 && diffDays < 56) {
        prevCases28d += c;
      }

      // Historical weekly buckets for baseline (diffDays >= 7 up to 84)
      if (diffDays >= 7 && diffDays < historicalWindowDays) {
        const weekIdx = Math.floor(diffDays / 7);
        historicalWeeklyBuckets.set(weekIdx, (historicalWeeklyBuckets.get(weekIdx) || 0) + c);
      }
    }

    if (hasScreenedRecorded && screenedCountAccum > 0) {
      totalScreened7d = screenedCountAccum;
      totalPositive7d = positiveCountAccum;
    }

    const positivityRate7d =
      totalScreened7d !== undefined && totalScreened7d > 0
        ? Number((totalPositive7d! / totalScreened7d).toFixed(4))
        : undefined;

    // Growth rates
    const growthRate7d =
      prevCases7d > 0 ? Number(((cases7d - prevCases7d) / prevCases7d).toFixed(4)) : (cases7d > 0 ? 1.0 : 0.0);
    const growthRate14d =
      prevCases14d > 0 ? Number(((cases14d - prevCases14d) / prevCases14d).toFixed(4)) : (cases14d > 0 ? 1.0 : 0.0);
    const growthRate28d =
      prevCases28d > 0 ? Number(((cases28d - prevCases28d) / prevCases28d).toFixed(4)) : (cases28d > 0 ? 1.0 : 0.0);

    // Baseline calculation
    const weeklyValues = Array.from(historicalWeeklyBuckets.values());
    let baselineMean = 0;
    let baselineStd = 1.0;

    if (weeklyValues.length >= 2) {
      baselineMean = weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length;
      const variance =
        weeklyValues.reduce((acc, v) => acc + Math.pow(v - baselineMean, 2), 0) / (weeklyValues.length - 1);
      baselineStd = Math.max(0.5, Math.sqrt(variance));
    } else {
      // Default baseline fallback if insufficient historical weeks
      baselineMean = Math.max(1, prevCases7d || cases7d * 0.8);
      baselineStd = Math.max(1, baselineMean * 0.3);
    }

    const baselineDeviationRatio = Number((cases7d / Math.max(1, baselineMean)).toFixed(3));
    const zScore = Number(((cases7d - baselineMean) / baselineStd).toFixed(3));
    const isAnomalousVsBaseline = zScore >= 2.0 || baselineDeviationRatio >= 1.6;

    const facilityIds = Array.from(facilities);
    const reportingFacilitiesCount = Math.max(1, facilityIds.length);
    const isMultiFacilitySignal = reportingFacilitiesCount >= 2;

    return {
      regionId,
      diseaseCode,
      asOfDate: refDate.toISOString().slice(0, 10),
      cases7d,
      growthRate7d,
      cases14d,
      growthRate14d,
      cases28d,
      growthRate28d,
      totalScreened7d,
      totalPositive7d,
      positivityRate7d,
      hasValidDenominator: positivityRate7d !== undefined,
      historicalBaselineMean7d: Number(baselineMean.toFixed(1)),
      historicalBaselineStd7d: Number(baselineStd.toFixed(1)),
      baselineDeviationRatio,
      zScore,
      isAnomalousVsBaseline,
      reportingFacilitiesCount,
      facilityIds,
      isMultiFacilitySignal,
      observationCount: valid.length,
    };
  }
}
