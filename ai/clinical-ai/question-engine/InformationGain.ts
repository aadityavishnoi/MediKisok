/**
 * MediKiosk Clinical AI - Information Gain & Entropy Ranker
 * Measures reduction in differential diagnostic uncertainty across symptom trajectories.
 */

import { CanonicalQuestion } from '../schemas/question_schema';
import { NormalizedSymptomRecord } from '../preprocessing/normalize_symptoms';

export class InformationGainCalculator {
  /**
   * Calculates Shannon Entropy reduction / Information Gain score (0.0 to 1.0)
   * for a candidate question given the current patient symptom profile.
   */
  static computeInformationGain(
    question: CanonicalQuestion,
    normalizedSymptoms: NormalizedSymptomRecord[],
    answers: Record<string, string | boolean | number>,
  ): number {
    const symptomCodes = new Set(normalizedSymptoms.map((s) => s.symptomCode));
    let infoGain = 0.1; // baseline exploration factor

    // 1. Symptom overlap & relevance
    const overlapCount = question.relevantSymptomCodes.filter((code) => symptomCodes.has(code)).length;
    if (overlapCount > 0) {
      infoGain += Math.min(0.4, overlapCount * 0.20);
    }

    // 2. Differential coverage density
    // Questions addressing multiple active disease differentials provide higher entropy reduction
    const differentialWeight = Math.min(0.25, question.differentialCodes.length * 0.06);
    infoGain += differentialWeight;

    // 3. Unanswered core clinical dimensions
    // e.g., if fever is present but chronometry (FEV_001) is unasked, high gain
    if (symptomCodes.has('FEVER_ACUTE') && !answers['FEV_001'] && question.id === 'FEV_001') {
      infoGain += 0.25;
    }

    // If respiratory symptoms present and dyspnea (RESP_001) is unasked, high gain
    if (
      (symptomCodes.has('COUGH_ACUTE') || symptomCodes.has('FEVER_ACUTE') || symptomCodes.has('PHARYNGITIS_ACUTE')) &&
      !answers['RESP_001'] &&
      question.id === 'RESP_001'
    ) {
      infoGain += 0.30;
    }

    // If cough is present and sputum character (RESP_002) is unasked, high gain
    if (symptomCodes.has('COUGH_ACUTE') && !answers['RESP_002'] && question.id === 'RESP_002') {
      infoGain += 0.25;
    }

    // Cap maximum normalized gain at 1.0
    return Math.min(1.0, infoGain);
  }
}
