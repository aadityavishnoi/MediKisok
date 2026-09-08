/**
 * MediKiosk Clinical AI - Clinical Question Engine (Inference Runtime)
 * Production orchestrator uniting Symptom Normalization, Clinical Knowledge Graph,
 * Red-Flag Safety Checks, and Regional Surveillance Modifiers.
 */

import {
  NextQuestionApiRequest,
  NextQuestionApiResponse,
  NextQuestionApiRequestSchema,
} from '../schemas/api_schema.js';
import { RegionalSignal } from '../schemas/regional_signal_schema.js';
import { CLINICAL_QUESTION_GRAPH } from '../question-engine/ClinicalQuestionGraph.js';
import { SymptomNormalizer } from '../preprocessing/normalize_symptoms.js';
import { QuestionPrioritizer } from '../question-engine/QuestionPrioritizer.js';
import { MLQuestionRanker } from './MLQuestionRanker.js';

export class ClinicalQuestionEngine {
  /**
   * Evaluates patient state, reported symptoms, prior answers, and regional signals
   * using hybrid ML ranking with deterministic safety overrides and fallback.
   */
  static evaluateNextQuestion(input: unknown): NextQuestionApiResponse {
    // 1. Strict schema validation
    const validatedRequest = NextQuestionApiRequestSchema.parse(input);

    const { symptoms, answers, regionalSignals, patient } = validatedRequest;

    // 2. Normalize symptoms into canonical clinical records
    const normalizedSymptoms = SymptomNormalizer.normalizeList(symptoms);

    // 3. Compute deterministic prioritization & safety assessment (baseline & red-flag check)
    const prioritization = QuestionPrioritizer.prioritize(
      CLINICAL_QUESTION_GRAPH,
      normalizedSymptoms,
      answers,
      regionalSignals as unknown as RegionalSignal[],
    );

    if (!prioritization.selectedQuestion) {
      return {
        nextQuestion: null,
        reason: 'no_more_candidate_questions',
        safetyFlags: prioritization.safetyFlags,
        requiresDoctorReview: true,
      };
    }

    // 4. Hybrid ML Question Ranking with Deterministic Fallback
    try {
      const answeredIds = new Set<string>();
      for (const key of Object.keys(answers)) {
        answeredIds.add(key);
        if (key.startsWith('Q_')) {
          answeredIds.add(key.replace(/^Q_/, ''));
        } else {
          answeredIds.add(`Q_${key}`);
        }
      }

      const candidates = CLINICAL_QUESTION_GRAPH.filter((q) => !answeredIds.has(q.id));

      if (candidates.length > 0) {
        const mlRanked = MLQuestionRanker.rankCandidates(
          candidates,
          normalizedSymptoms,
          answers,
          patient,
          regionalSignals as unknown as RegionalSignal[],
        );

        if (mlRanked.length > 0) {
          const top = mlRanked[0];
          const isRedFlagScreening = prioritization.reason === 'red_flag_screening' || top.isRedFlagEscalated;
          const selectedQuestion = isRedFlagScreening && prioritization.reason === 'red_flag_screening'
            ? prioritization.selectedQuestion
            : top.question;

          const effectivePriority = isRedFlagScreening ? 'HIGH' : selectedQuestion.priority;
          const effectiveReason = isRedFlagScreening
            ? 'red_flag_screening'
            : (prioritization.reason.includes('outbreak') ? prioritization.reason : 'ml_prioritized_intake');

          return {
            nextQuestion: {
              id: selectedQuestion.id,
              text: selectedQuestion.text,
              priority: effectivePriority,
            },
            reason: effectiveReason,
            safetyFlags: prioritization.safetyFlags,
            requiresDoctorReview: true,
          };
        }
      }
    } catch {
      // Deterministic fallback: gracefully fall back to QuestionPrioritizer
    }

    return {
      nextQuestion: {
        id: prioritization.selectedQuestion.id,
        text: prioritization.selectedQuestion.text,
        priority: prioritization.effectivePriority,
      },
      reason: prioritization.reason,
      safetyFlags: prioritization.safetyFlags,
      requiresDoctorReview: true,
    };
  }
}
