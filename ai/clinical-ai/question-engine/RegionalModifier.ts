/**
 * MediKiosk Clinical AI - Regional Outbreak Signal Modifier
 * Adjusts question priority weights based on real-time regional epidemiological surveillance.
 * Strict non-diagnostic invariant: Surveillance priors inform questioning triage, never diagnosis.
 */

import { RegionalSignal } from '../schemas/regional_signal_schema';
import { CanonicalQuestion } from '../schemas/question_schema';

export interface RegionalBoostResult {
  scoreBoost: number;
  outbreakReason: string | null;
  activeSurveillanceDisease: string | null;
}

export class RegionalModifier {
  /**
   * Computes priority boost for a candidate question based on regional surveillance signals
   */
  static computeBoost(question: CanonicalQuestion, regionalSignals: RegionalSignal[]): RegionalBoostResult {
    if (!regionalSignals || regionalSignals.length === 0 || !question.relatedOutbreakDisease) {
      return { scoreBoost: 0, outbreakReason: null, activeSurveillanceDisease: null };
    }

    let maxBoost = 0;
    let matchedDisease: string | null = null;
    let outbreakReason: string | null = null;

    const targetDisease = question.relatedOutbreakDisease.toUpperCase();

    for (const signal of regionalSignals) {
      if (!signal.disease) continue;

      const signalDisease = signal.disease.toUpperCase();
      const isMatch = signalDisease.includes(targetDisease) || targetDisease.includes(signalDisease);

      if (!isMatch) continue;

      // Check signal sample confidence
      // Low-confidence or insufficient sample signals must not distort clinical questioning
      if (signal.confidence === 'LOW_CONFIDENCE' || signal.confidence === 'INSUFFICIENT_SAMPLE') {
        continue;
      }

      let boost = 0;
      switch (signal.riskLevel) {
        case 'CRITICAL':
          boost = 0.50;
          break;
        case 'HIGH':
          boost = 0.35;
          break;
        case 'MODERATE':
          boost = 0.15;
          break;
        case 'LOW':
        default:
          boost = 0.05;
          break;
      }

      // If trend indicates rising outbreak or surge, add secondary factor
      if (signal.trend && (signal.trend.includes('SURGE') || signal.trend.includes('RISING'))) {
        boost += 0.10;
      }

      if (boost > maxBoost) {
        maxBoost = boost;
        matchedDisease = signal.disease;
        outbreakReason = `regional_${signal.disease.toLowerCase().replace(/[^a-z0-9]/g, '_')}_outbreak_elevation`;
      }
    }

    return {
      scoreBoost: maxBoost,
      outbreakReason,
      activeSurveillanceDisease: matchedDisease,
    };
  }
}
