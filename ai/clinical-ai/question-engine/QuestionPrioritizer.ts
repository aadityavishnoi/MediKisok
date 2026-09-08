/**
 * MediKiosk Clinical AI - Question Prioritizer
 * Multi-factor ranking engine combining Shannon entropy reduction,
 * red-flag escalation, symptom correlation, and regional epidemiological signals.
 */

import { CanonicalQuestion, QuestionPriority } from '../schemas/question_schema';
import { NormalizedSymptomRecord } from '../preprocessing/normalize_symptoms';
import { RegionalSignal } from '../schemas/regional_signal_schema';
import { RedFlagDetector } from './RedFlagDetector';
import { RegionalModifier } from './RegionalModifier';
import { InformationGainCalculator } from './InformationGain';

export interface PrioritizedQuestionSelection {
  selectedQuestion: CanonicalQuestion | null;
  effectivePriority: QuestionPriority;
  reason: string;
  safetyFlags: string[];
  candidateScore: number;
}

export class QuestionPrioritizer {
  /**
   * Evaluates all candidate questions and selects the next highest-yield clinical question
   */
  static prioritize(
    allQuestions: CanonicalQuestion[],
    normalizedSymptoms: NormalizedSymptomRecord[],
    answers: Record<string, string | boolean | number>,
    regionalSignals: RegionalSignal[] = [],
  ): PrioritizedQuestionSelection {
    const redFlagAssessment = RedFlagDetector.assess(normalizedSymptoms, answers, allQuestions);
    const answeredIds = new Set<string>();

    for (const key of Object.keys(answers)) {
      answeredIds.add(key);
      if (key.startsWith('Q_')) {
        answeredIds.add(key.replace(/^Q_/, ''));
      } else {
        answeredIds.add(`Q_${key}`);
      }
    }

    // 1. Filter out previously answered questions
    const candidates = allQuestions.filter(
      (q) => !answeredIds.has(q.id) && !answeredIds.has(`Q_${q.id}`),
    );

    if (candidates.length === 0) {
      return {
        selectedQuestion: null,
        effectivePriority: 'LOW',
        reason: 'no_more_candidate_questions',
        safetyFlags: redFlagAssessment.activeSafetyFlags,
        candidateScore: 0,
      };
    }

    const symptomCodes = new Set(normalizedSymptoms.map((s) => s.symptomCode));

    // 2. Score each candidate question
    const scoredCandidates = candidates.map((q) => {
      let score = q.baseScore;
      let primaryReason = 'differential_evidence_ranking';

      // Factor A: Information Gain & Entropy Reduction
      const infoGain = InformationGainCalculator.computeInformationGain(q, normalizedSymptoms, answers);
      score += infoGain * 0.35;

      // Factor B: Symptom-Specific Contextual Relevance
      if (symptomCodes.has('PRECORDIAL_CHEST_PAIN') && q.category === 'CARDIOVASCULAR') {
        score += 0.85;
      }
      if (symptomCodes.has('DYSPNEA_ACUTE') && q.id === 'RESP_001') {
        score += 0.80;
      }
      if (symptomCodes.has('COUGH_ACUTE') && (q.id === 'RESP_001' || q.id === 'RESP_002')) {
        score += 0.45;
      }
      if (symptomCodes.has('FEVER_ACUTE')) {
        if (q.id === 'FEV_001') score += 0.40;
        if (q.id === 'FEV_002') score += 0.30;
      }

      // Factor C: Regional Outbreak Prior Modifiers
      const regBoost = RegionalModifier.computeBoost(q, regionalSignals);
      if (regBoost.scoreBoost > 0) {
        score += regBoost.scoreBoost;
        if (regBoost.outbreakReason) {
          primaryReason = regBoost.outbreakReason;
        }
      }

      // Factor D: Red-Flag Escalation Override
      const isRedFlagRecommended = redFlagAssessment.recommendedQuestionIds.includes(q.id);
      if (q.redFlag && isRedFlagRecommended) {
        score += 1.50; // Highest priority jump
        primaryReason = 'red_flag_screening';
      } else if (q.redFlag && (symptomCodes.has('DYSPNEA_ACUTE') || symptomCodes.has('PRECORDIAL_CHEST_PAIN'))) {
        score += 1.20;
        primaryReason = 'red_flag_screening';
      }

      return {
        question: q,
        score,
        reason: primaryReason,
      };
    });

    // Sort descending by score
    scoredCandidates.sort((a, b) => b.score - a.score);
    const topScored = scoredCandidates[0];

    // Determine effective priority tag
    let effectivePriority: QuestionPriority = topScored.question.priority;
    if (topScored.question.redFlag || topScored.reason === 'red_flag_screening') {
      effectivePriority = 'HIGH';
    }

    return {
      selectedQuestion: topScored.question,
      effectivePriority,
      reason: topScored.reason,
      safetyFlags: redFlagAssessment.activeSafetyFlags,
      candidateScore: topScored.score,
    };
  }
}
