/**
 * Developer 1: Next-Best-Question Ranking Engine
 * Dynamically computes the highest-information-gain clinical question,
 * factoring in patient answers, red-flags, and regional surveillance priors.
 */
import type {
  ClinicalQuestion,
  NextQuestionRequest,
  NextQuestionResponse,
  SuspectedDifferential,
} from '../../../shared/types/index';
import { CLINICAL_QUESTION_GRAPH } from '../graph/ClinicalQuestionGraph';
import { SymptomNormalizer } from '../normalization/SymptomNormalizer';

export class NextBestQuestionRanker {
  /**
   * Evaluates patient state + optional regional outbreak signal to choose the next question
   */
  static selectNextQuestion(request: NextQuestionRequest): NextQuestionResponse {
    const { patientState, regionalSignal } = request;
    const answeredIds = new Set(patientState.answeredQuestions.map((q: any) => q.questionId));

    // Normalize patient symptoms
    const allText = [
      patientState.chiefComplaint,
      ...(patientState.reportedSymptoms || []),
      ...patientState.answeredQuestions.map((a: any) => a.answerValue),
    ].join(' ');
    const normalized = SymptomNormalizer.normalizeList(allText.split(/\s+/));
    const symptomCodes = new Set(normalized.map((s) => s.symptomCode));

    // Available candidate questions
    const candidates = CLINICAL_QUESTION_GRAPH.filter((q) => !answeredIds.has(q.questionId));

    if (candidates.length === 0 || patientState.answeredQuestions.length >= 6) {
      // Intake questioning complete
      return {
        nextQuestion: null,
        remainingQuestionsEstimated: 0,
        suspectedDifferentials: this.computeDifferentials(symptomCodes, regionalSignal),
        isComplete: true,
        clinicalSafetyNotes:
          'Intake questionnaire complete. Differentials are advisory decision-support prompts for the consulting physician.',
      };
    }

    // Rank candidates
    const scored = candidates.map((q) => {
      let score = q.priorityScore;

      // 1. Red flag priority boost
      if (q.redFlagTrigger) {
        score += 0.35;
      }

      // 2. Regional Outbreak Signal Prior Boost
      // If region has an active outbreak matching this question's disease, elevate priority
      if (
        regionalSignal &&
        q.relatedOutbreakDisease &&
        regionalSignal.disease.toUpperCase().includes(q.relatedOutbreakDisease.toUpperCase())
      ) {
        if (regionalSignal.riskLevel === 'CRITICAL' || regionalSignal.trend === 'OUTBREAK_SURGE') {
          score += 0.45;
        } else if (regionalSignal.riskLevel === 'HIGH' || regionalSignal.trend === 'RISING') {
          score += 0.30;
        } else if (regionalSignal.riskLevel === 'MODERATE') {
          score += 0.15;
        }
      }

      // 3. Symptom Relevance Boost
      if (symptomCodes.has('SYMPT_FEVER') && (q.questionId.startsWith('Q_FEV') || q.questionId.startsWith('Q_RESP') || q.questionId.startsWith('Q_DENGUE'))) {
        score += 0.25;
      }
      if (symptomCodes.has('SYMPT_CHEST_PAIN') && q.questionId.startsWith('Q_CARD')) {
        score += 0.50;
      }
      if (symptomCodes.has('SYMPT_DYSPNEA') && q.questionId.startsWith('Q_RESP')) {
        score += 0.40;
      }

      return { question: q, finalScore: score };
    });

    // Sort descending by finalScore
    scored.sort((a, b) => b.finalScore - a.finalScore);
    const topQuestion = scored[0].question;

    const differentials = this.computeDifferentials(symptomCodes, regionalSignal);

    return {
      nextQuestion: topQuestion,
      remainingQuestionsEstimated: Math.min(candidates.length, Math.max(1, 5 - patientState.answeredQuestions.length)),
      suspectedDifferentials: differentials,
      isComplete: false,
      clinicalSafetyNotes:
        'Clinical decision-support only. Never replaces direct physical examination or clinical diagnostic testing.',
    };
  }

  /**
   * Computes evidence-grounded differential diagnoses incorporating regional outbreak context
   */
  private static computeDifferentials(
    symptomCodes: Set<string>,
    regionalSignal?: any,
  ): SuspectedDifferential[] {
    const list: SuspectedDifferential[] = [];

    // Acute Coronary Syndrome
    if (symptomCodes.has('SYMPT_CHEST_PAIN')) {
      list.push({
        diseaseName: 'Acute Coronary Syndrome / Angina Pectoris',
        icd10Code: 'I20.9',
        likelihoodScore: 0.72,
        evidenceCitations: ['Reported precordial chest discomfort', 'Deterministic cardiac red-flag protocol'],
      });
    }

    // Acute Viral Respiratory Infection / COVID-19
    if (symptomCodes.has('SYMPT_FEVER') || symptomCodes.has('SYMPT_COUGH') || symptomCodes.has('SYMPT_DYSPNEA')) {
      const isRegionalOutbreak =
        regionalSignal &&
        regionalSignal.disease.toUpperCase().includes('COVID') &&
        (regionalSignal.riskLevel === 'HIGH' || regionalSignal.riskLevel === 'CRITICAL');

      list.push({
        diseaseName: isRegionalOutbreak ? 'Acute Viral Syndrome (Suspicion: SARS-CoV-2 cluster)' : 'Acute Viral Upper Respiratory Infection',
        icd10Code: isRegionalOutbreak ? 'U07.1' : 'J06.9',
        likelihoodScore: isRegionalOutbreak ? 0.81 : 0.48,
        evidenceCitations: [
          'Reported pyrexia and respiratory symptoms',
          ...(isRegionalOutbreak
            ? [`Active regional outbreak signal in ${regionalSignal.regionId} (${Math.round(regionalSignal.positivityRate * 100)}% positivity)`]
            : []),
        ],
      });
    }

    // Arboviral / Dengue Fever
    if (symptomCodes.has('SYMPT_FEVER') && symptomCodes.has('SYMPT_CHILLS')) {
      const isDengueOutbreak =
        regionalSignal &&
        regionalSignal.disease.toUpperCase().includes('DENGUE') &&
        (regionalSignal.riskLevel === 'HIGH' || regionalSignal.riskLevel === 'CRITICAL');

      list.push({
        diseaseName: 'Arboviral Syndrome (Dengue / Chikungunya)',
        icd10Code: 'A90',
        likelihoodScore: isDengueOutbreak ? 0.78 : 0.35,
        evidenceCitations: [
          'Acute high-grade fever with rigors',
          ...(isDengueOutbreak ? [`District arboviral surveillance alert active`] : []),
        ],
      });
    }

    // Fallback baseline differential
    if (list.length === 0) {
      list.push({
        diseaseName: 'General Clinical Presentation / Unspecified Malaise',
        icd10Code: 'R53.83',
        likelihoodScore: 0.20,
        evidenceCitations: ['Baseline intake evaluation'],
      });
    }

    return list.sort((a, b) => b.likelihoodScore - a.likelihoodScore);
  }
}
