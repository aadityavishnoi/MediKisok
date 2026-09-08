/**
 * MediKiosk Clinical AI - ML Question Ranker
 * Learned clinical trajectory ranking model with deterministic safety overrides
 * and automatic fallback guarantees.
 */

import { CanonicalQuestion } from '../schemas/question_schema.js';
import { NormalizedSymptomRecord } from '../preprocessing/normalize_symptoms.js';
import { RegionalSignal } from '../schemas/regional_signal_schema.js';

export interface ModelWeights {
  modelType: string;
  version: string;
  bias: number;
  weights: Record<string, number>;
}

export interface ScoredQuestion {
  question: CanonicalQuestion;
  mlScore: number;
  effectiveScore: number;
  isRedFlagEscalated: boolean;
  rationale: string;
}

// Built-in verified model weights (trained from held-out DDXPlus trajectories v1.0.0)
export const DEFAULT_MODEL_WEIGHTS: ModelWeights = {
  modelType: 'LogisticRankingModel',
  version: '1.0.0',
  bias: -2.9572646617889404,
  weights: {
    age_scaled: -0.840364933013916,
    gender_is_female: 0.17710523307323456,
    step_index_scaled: 8.496696472167969,
    history_len_scaled: 8.496696472167969,
    q_base_score: -0.7761667370796204,
    q_is_red_flag: -0.01523490622639656,
    state_has_chest_pain: -4.199004173278809,
    state_has_dyspnea: 0.3063494563102722,
    state_has_fever: -6.609025955200195,
    state_has_cough: -1.8033785820007324,
    state_has_gi: -3.894760847091675,
    state_has_headache: -0.6879485845565796,
    symptom_overlap_count: 4.7581562995910645,
    symptom_overlap_ratio: -0.17548008263111115,
    active_red_flag_interaction: 0.9319043755531311,
    regional_outbreak_match: 0.017925353720784187,
    q_is_CARD_001: 1.4485656023025513,
    q_is_CARD_002: 1.4641096591949463,
    q_is_DENGUE_001: -1.8086901903152466,
    q_is_FEV_001: 3.0699715614318848,
    q_is_FEV_002: 2.0147671699523926,
    q_is_GI_001: -2.728757619857788,
    q_is_GI_002: 0.8004971742630005,
    q_is_NEURO_001: -1.4654101133346558,
    q_is_RESP_001: 0.46575966477394104,
    q_is_RESP_002: -0.3534560203552246,
    q_is_RESP_003: -4.814108371734619,
  },
};

export class MLQuestionRanker {
  private static activeWeights: ModelWeights = DEFAULT_MODEL_WEIGHTS;

  /**
   * Sets or overrides the active model weights (e.g. from loaded artifact or test mock)
   */
  static setModelWeights(weights: ModelWeights | null): void {
    if (weights === null) {
      this.activeWeights = null as unknown as ModelWeights;
    } else {
      this.activeWeights = weights;
    }
  }

  /**
   * Resets active weights to default verified weights
   */
  static resetToDefault(): void {
    this.activeWeights = DEFAULT_MODEL_WEIGHTS;
  }

  /**
   * Extracts feature vector for a candidate question given the current patient state
   */
  static extractFeatures(
    candidate: CanonicalQuestion,
    normalizedSymptoms: NormalizedSymptomRecord[],
    answers: Record<string, string | boolean | number>,
    patient?: { age?: number; gender?: string },
    regionalSignals: RegionalSignal[] = [],
  ): Record<string, number> {
    const age = patient?.age ?? 35;
    const gender = patient?.gender ?? 'M';

    const historyLen = Object.keys(answers).length;
    const symptomKeys = new Set(normalizedSymptoms.map((s) => s.symptomCode));

    const hasChestPain = symptomKeys.has('PRECORDIAL_CHEST_PAIN') ? 1.0 : 0.0;
    const hasDyspnea = symptomKeys.has('DYSPNEA_ACUTE') ? 1.0 : 0.0;
    const hasFever = symptomKeys.has('FEVER_ACUTE') ? 1.0 : 0.0;
    const hasCough = symptomKeys.has('COUGH_ACUTE') ? 1.0 : 0.0;
    const hasGI = (symptomKeys.has('EMESIS_VOMITING') || symptomKeys.has('DIARRHEA_ACUTE') || symptomKeys.has('ABDOMINAL_PAIN_UNSPEC')) ? 1.0 : 0.0;
    const hasHeadache = symptomKeys.has('CEPHALEA_HEADACHE') ? 1.0 : 0.0;

    const relevant = new Set(candidate.relevantSymptomCodes);
    let overlapCount = 0;
    for (const key of symptomKeys) {
      if (relevant.has(key)) overlapCount++;
    }
    const overlapRatio = relevant.size > 0 ? overlapCount / relevant.size : 0.0;

    // Active red flag interaction
    const hasAcuteRf = hasChestPain > 0 || hasDyspnea > 0 || (hasGI > 0 && candidate.category === 'GASTROINTESTINAL') || (hasHeadache > 0 && candidate.id === 'NEURO_001');
    const activeRfInteraction = hasAcuteRf && candidate.redFlag ? 1.0 : 0.0;

    // Regional outbreak match
    let regionalMatch = 0.0;
    if (candidate.relatedOutbreakDisease) {
      const outbreakTarget = candidate.relatedOutbreakDisease.toUpperCase();
      for (const sig of regionalSignals) {
        if (sig.disease.toUpperCase() === outbreakTarget && (sig.riskLevel === 'HIGH' || sig.riskLevel === 'CRITICAL') && sig.confidence !== 'LOW_CONFIDENCE') {
          regionalMatch = 1.0;
          break;
        }
      }
    }

    const feats: Record<string, number> = {
      age_scaled: age / 100.0,
      gender_is_female: gender === 'F' ? 1.0 : 0.0,
      step_index_scaled: historyLen / 10.0,
      history_len_scaled: historyLen / 10.0,
      q_base_score: candidate.baseScore,
      q_is_red_flag: candidate.redFlag ? 1.0 : 0.0,
      state_has_chest_pain: hasChestPain,
      state_has_dyspnea: hasDyspnea,
      state_has_fever: hasFever,
      state_has_cough: hasCough,
      state_has_gi: hasGI,
      state_has_headache: hasHeadache,
      symptom_overlap_count: overlapCount,
      symptom_overlap_ratio: overlapRatio,
      active_red_flag_interaction: activeRfInteraction,
      regional_outbreak_match: regionalMatch,
    };

    feats[`q_is_${candidate.id}`] = 1.0;
    return feats;
  }

  /**
   * Computes probability score using logistic sigmoid
   */
  static computeScore(feats: Record<string, number>, weights: ModelWeights): number {
    let logit = weights.bias;
    for (const [name, val] of Object.entries(feats)) {
      const w = weights.weights[name] ?? 0.0;
      logit += val * w;
    }
    // Clamped sigmoid
    const clampedLogit = Math.max(-20.0, Math.min(20.0, logit));
    return 1.0 / (1.0 + Math.exp(-clampedLogit));
  }

  /**
   * Ranks eligible candidate questions using the learned model and enforces
   * deterministic safety overrides for acute red-flag presentations.
   */
  static rankCandidates(
    candidateQuestions: CanonicalQuestion[],
    normalizedSymptoms: NormalizedSymptomRecord[],
    answers: Record<string, string | boolean | number>,
    patient?: { age?: number; gender?: string },
    regionalSignals: RegionalSignal[] = [],
  ): ScoredQuestion[] {
    if (!this.activeWeights || !this.activeWeights.weights) {
      throw new Error('ML model weights unavailable or uninitialized.');
    }

    const symptomKeys = new Set(normalizedSymptoms.map((s) => s.symptomCode));
    const hasChestPain = symptomKeys.has('PRECORDIAL_CHEST_PAIN');
    const hasDyspnea = symptomKeys.has('DYSPNEA_ACUTE');
    const hasAcuteGI = symptomKeys.has('EMESIS_VOMITING') || symptomKeys.has('DIARRHEA_ACUTE') || symptomKeys.has('ABDOMINAL_PAIN_UNSPEC');
    const hasAcuteHeadache = symptomKeys.has('CEPHALEA_HEADACHE');

    const scored: ScoredQuestion[] = [];

    for (const cand of candidateQuestions) {
      const feats = this.extractFeatures(cand, normalizedSymptoms, answers, patient, regionalSignals);
      const mlScore = this.computeScore(feats, this.activeWeights);

      let effectiveScore = mlScore;
      let isRedFlagEscalated = false;
      let rationale = 'ml_ranking';

      // Deterministic Red-Flag Safety Override:
      // If patient presents with acute danger symptoms, immediately boost matching red-flag screening questions
      if (cand.redFlag) {
        if (
          (hasChestPain && (cand.id === 'CARD_001' || cand.id === 'CARD_002')) ||
          (hasDyspnea && cand.id === 'RESP_001') ||
          (hasAcuteHeadache && cand.id === 'NEURO_001') ||
          (hasAcuteGI && (cand.id === 'GI_001' || cand.id === 'GI_002'))
        ) {
          effectiveScore += 10.0;
          isRedFlagEscalated = true;
          rationale = 'red_flag_screening';
        }
      }

      scored.push({
        question: cand,
        mlScore,
        effectiveScore,
        isRedFlagEscalated,
        rationale,
      });
    }

    scored.sort((a, b) => b.effectiveScore - a.effectiveScore);
    return scored;
  }
}
