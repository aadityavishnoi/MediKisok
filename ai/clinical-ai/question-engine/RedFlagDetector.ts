/**
 * MediKiosk Clinical AI - Red Flag Detector
 * Rapidly flags acute life-threatening symptoms, vital signs instability, and critical triage findings.
 */

import { NormalizedSymptomRecord } from '../preprocessing/normalize_symptoms';
import { CanonicalQuestion } from '../schemas/question_schema';

export interface RedFlagAssessment {
  hasRedFlag: boolean;
  escalatedReason: string | null;
  activeSafetyFlags: string[];
  recommendedQuestionIds: string[];
}

export class RedFlagDetector {
  /**
   * Assesses reported symptoms and prior answers for acute red flag indications
   */
  static assess(
    normalizedSymptoms: NormalizedSymptomRecord[],
    answers: Record<string, string | boolean | number>,
    allQuestions: CanonicalQuestion[],
  ): RedFlagAssessment {
    const safetyFlags: string[] = [];
    const recommendedQuestionIds: string[] = [];
    let escalatedReason: string | null = null;

    const symptomCodes = new Set(normalizedSymptoms.map((s) => s.symptomCode));

    // 1. Evaluate symptom-level red flags
    if (symptomCodes.has('PRECORDIAL_CHEST_PAIN')) {
      safetyFlags.push('URGENT: Precordial chest pain reported - cardiac evaluation indicated');
      recommendedQuestionIds.push('CARD_001', 'CARD_002');
      escalatedReason = 'red_flag_screening';
    }

    if (symptomCodes.has('DYSPNEA_ACUTE')) {
      safetyFlags.push('URGENT: Acute dyspnea reported - respiratory distress screening required');
      recommendedQuestionIds.push('RESP_001');
      escalatedReason = 'red_flag_screening';
    }

    // 2. Evaluate answer-level red flags (from previous answers)
    for (const [qId, answerVal] of Object.entries(answers)) {
      const q = allQuestions.find((item) => item.id === qId || `Q_${item.id}` === qId);
      if (!q) continue;

      const stringVal = String(answerVal).toLowerCase();

      // Check if chosen option is explicitly marked as red flag
      const chosenOption = q.options.find(
        (opt) => opt.value.toLowerCase() === stringVal || String(opt.value).toLowerCase() === stringVal,
      );

      if (chosenOption?.isRedFlag || (stringVal === 'true' && q.redFlag)) {
        safetyFlags.push(`CRITICAL_FINDING: Positive red flag on ${q.id} ("${chosenOption?.label || stringVal}")`);
        if (!escalatedReason) {
          escalatedReason = 'red_flag_screening';
        }
      }
    }

    const hasRedFlag = safetyFlags.length > 0;

    return {
      hasRedFlag,
      escalatedReason,
      activeSafetyFlags: safetyFlags,
      recommendedQuestionIds,
    };
  }
}
