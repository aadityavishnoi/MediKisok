/**
 * MediKiosk Clinical AI - Clinical Question Engine (Inference Runtime)
 * Production orchestrator uniting Symptom Normalization, Clinical Knowledge Graph,
 * Red-Flag Safety Checks, and Regional Surveillance Modifiers.
 */

import {
  NextQuestionApiRequest,
  NextQuestionApiResponse,
  NextQuestionApiRequestSchema,
} from '../schemas/api_schema';
import { CLINICAL_QUESTION_GRAPH } from '../question-engine/ClinicalQuestionGraph';
import { SymptomNormalizer } from '../preprocessing/normalize_symptoms';
import { QuestionPrioritizer } from '../question-engine/QuestionPrioritizer';

export class ClinicalQuestionEngine {
  /**
   * Evaluates patient state, reported symptoms, prior answers, and regional signals
   * to determine the next highest-yield clinical question.
   */
  static evaluateNextQuestion(input: unknown): NextQuestionApiResponse {
    // 1. Strict schema validation
    const validatedRequest = NextQuestionApiRequestSchema.parse(input);

    const { symptoms, answers, regionalSignals } = validatedRequest;

    // 2. Normalize symptoms into canonical clinical records
    const normalizedSymptoms = SymptomNormalizer.normalizeList(symptoms);

    // 3. Compute question prioritization
    const prioritization = QuestionPrioritizer.prioritize(
      CLINICAL_QUESTION_GRAPH,
      normalizedSymptoms,
      answers,
      regionalSignals,
    );

    if (!prioritization.selectedQuestion) {
      return {
        nextQuestion: null,
        reason: 'no_more_candidate_questions',
        safetyFlags: prioritization.safetyFlags,
        requiresDoctorReview: true,
      };
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
