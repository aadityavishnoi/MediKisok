/**
 * Developer 2: Regional Outbreak Signal Engine
 *
 * Synthesizes multi-facility temporal features, baseline statistical deviations,
 * positivity rates, and sample size confidence into clinical decision-support signals.
 *
 * CLINICAL SAFETY MANDATE:
 * Produces population-level surveillance signals. Strictly flags individualDiagnosis: false.
 */
import type { RegionalTemporalFeatures } from '../features/TemporalFeatureExtractor';
import { BayesianOutbreakEstimator } from '../BayesianOutbreakEstimator';

export interface RegionalOutbreakSignal {
  regionId: string;
  diseaseCode: string;
  diseaseName?: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  trend: 'RISING' | 'STABLE' | 'FALLING' | 'UNKNOWN';
  sampleSize?: number;
  positivityRate?: number;
  baselineDeviation?: number;
  facilityCount?: number;
  confidence: 'LOW_SAMPLE' | 'INSUFFICIENT_HISTORY' | 'MODERATE' | 'ADEQUATE_SAMPLE';
  evidence: string[];
  clinicalUse: {
    individualDiagnosis: false;
    enhancedScreeningRecommended: boolean;
    doctorReviewRequired: boolean;
  };
  generatedAt: string;
}

export class OutbreakSignalEngine {
  /**
   * Evaluates extracted regional features into an authoritative outbreak signal.
   */
  static evaluateSignal(features: RegionalTemporalFeatures): RegionalOutbreakSignal {
    const evidence: string[] = [];

    // 1. Evaluate Trend
    let trend: RegionalOutbreakSignal['trend'] = 'STABLE';
    if (features.growthRate7d <= -0.20) {
      trend = 'FALLING';
      evidence.push(`7-day activity is declining at ${Math.round(features.growthRate7d * 100)}%`);
    } else if (features.growthRate7d >= 0.25 || (features.growthRate14d >= 0.35 && features.growthRate7d >= 0)) {
      trend = 'RISING';
      evidence.push(`7-day growth rate is elevated at +${Math.round(features.growthRate7d * 100)}%`);
    } else {
      trend = 'STABLE';
      evidence.push('Activity trend is stable within standard historical thresholds');
    }

    // 2. Baseline Deviation Evidence
    if (features.isAnomalousVsBaseline) {
      evidence.push(
        `7-day case count (${features.cases7d}) exceeds expected baseline mean (${features.historicalBaselineMean7d}) by ${Math.round((features.baselineDeviationRatio - 1) * 100)}% (z-score: ${features.zScore})`,
      );
    }

    // 3. Facility Clustering
    if (features.isMultiFacilitySignal) {
      evidence.push(
        `Signal observed synchronously across ${features.reportingFacilitiesCount} independent facilities (${features.facilityIds.slice(0, 3).join(', ')}${features.facilityIds.length > 3 ? '...' : ''})`,
      );
    } else {
      evidence.push('Signal currently localized to a single reporting sentinel facility');
    }

    // 4. Positivity & Sample Size Protection
    let confidence: RegionalOutbreakSignal['confidence'] = 'MODERATE';
    let riskLevel: RegionalOutbreakSignal['riskLevel'] = 'LOW';

    if (features.hasValidDenominator && features.totalScreened7d !== undefined) {
      const n = features.totalScreened7d;
      const k = features.totalPositive7d || 0;
      const rate = features.positivityRate7d!;

      if (n < 25) {
        confidence = 'LOW_SAMPLE';
        evidence.push(`Small sample size (${k}/${n} screened, observed rate: ${Math.round(rate * 100)}%). Wilson CI is wide; rate smoothed to prevent over-inference.`);
        // Small sample cluster logic (e.g. Region X 8/10)
        if (rate >= 0.50 && k >= 4) {
          riskLevel = 'CRITICAL';
        } else if (rate >= 0.25 || trend === 'RISING') {
          riskLevel = 'HIGH';
        } else if (rate >= 0.10) {
          riskLevel = 'MODERATE';
        } else {
          riskLevel = 'LOW';
        }
      } else {
        confidence = n >= 100 ? 'ADEQUATE_SAMPLE' : 'MODERATE';
        evidence.push(`Adequate screening denominator of ${n} subjects (${k} confirmed positives, positivity: ${Math.round(rate * 100)}%)`);

        if (rate >= 0.20 || (rate >= 0.10 && features.isAnomalousVsBaseline)) {
          riskLevel = 'CRITICAL';
        } else if (rate >= 0.08 || (rate >= 0.05 && trend === 'RISING')) {
          riskLevel = 'HIGH';
        } else if (rate >= 0.04 || features.isAnomalousVsBaseline) {
          riskLevel = 'MODERATE';
        } else {
          riskLevel = 'LOW';
        }
      }
    } else {
      // Missing Denominator Scenario (Positivity undefined, rely strictly on case volume and baseline anomaly)
      evidence.push('Screening denominator unrecorded in sentinel feed; positivity rate preserved as uncalculated');

      if (features.observationCount < 3) {
        confidence = 'INSUFFICIENT_HISTORY';
        riskLevel = features.cases7d > 10 ? 'MODERATE' : 'LOW';
      } else if (features.isAnomalousVsBaseline && features.isMultiFacilitySignal && trend === 'RISING') {
        confidence = 'MODERATE';
        riskLevel = 'HIGH';
      } else if (features.isAnomalousVsBaseline || trend === 'RISING') {
        confidence = 'MODERATE';
        riskLevel = 'MODERATE';
      } else {
        confidence = 'MODERATE';
        riskLevel = 'LOW';
      }
    }

    const enhancedScreeningRecommended = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

    return {
      regionId: features.regionId,
      diseaseCode: features.diseaseCode,
      riskLevel,
      trend,
      sampleSize: features.totalScreened7d,
      positivityRate: features.positivityRate7d,
      baselineDeviation: features.baselineDeviationRatio,
      facilityCount: features.reportingFacilitiesCount,
      confidence,
      evidence,
      clinicalUse: {
        individualDiagnosis: false,
        enhancedScreeningRecommended,
        doctorReviewRequired: enhancedScreeningRecommended,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
