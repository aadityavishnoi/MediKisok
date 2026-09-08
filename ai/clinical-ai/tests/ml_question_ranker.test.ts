/**
 * MediKiosk Clinical AI - ML Question Ranker & Hybrid Engine Tests
 * Tests Phase 13 requirements: model loading, candidate ranking, red-flag override,
 * fallback on missing model, duplicate filtering, safety invariants.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MLQuestionRanker, DEFAULT_MODEL_WEIGHTS } from '../inference/MLQuestionRanker.js';
import { ClinicalQuestionEngine } from '../inference/ClinicalQuestionEngine.js';
import { CLINICAL_QUESTION_GRAPH } from '../question-engine/ClinicalQuestionGraph.js';
import { SymptomNormalizer } from '../preprocessing/normalize_symptoms.js';
import { NextQuestionApiRequest } from '../schemas/api_schema.js';

describe('MLQuestionRanker & Hybrid Inference Engine', () => {
  beforeEach(() => {
    MLQuestionRanker.resetToDefault();
  });

  // 1. Model loads correctly
  it('1. Model loads correctly with valid weights schema and bias', () => {
    expect(DEFAULT_MODEL_WEIGHTS).toBeDefined();
    expect(DEFAULT_MODEL_WEIGHTS.modelType).toBe('LogisticRankingModel');
    expect(DEFAULT_MODEL_WEIGHTS.version).toBe('1.0.0');
    expect(typeof DEFAULT_MODEL_WEIGHTS.bias).toBe('number');
    expect(Object.keys(DEFAULT_MODEL_WEIGHTS.weights).length).toBeGreaterThan(15);
  });

  // 2. Model ranks candidate questions
  it('2. Model ranks candidate questions according to presenting clinical symptoms', () => {
    const symptoms = SymptomNormalizer.normalizeList(['fever', 'chills']);
    const candidates = CLINICAL_QUESTION_GRAPH.filter((q) => q.id === 'FEV_001' || q.id === 'GI_002');
    
    const ranked = MLQuestionRanker.rankCandidates(candidates, symptoms, {});
    expect(ranked.length).toBe(2);
    // Fever question should rank higher than appendicitis question for fever presentation
    expect(ranked[0].question.id).toBe('FEV_001');
    expect(ranked[0].effectiveScore).toBeGreaterThan(ranked[1].effectiveScore);
  });

  // 3. Invalid model input is rejected
  it('3. Invalid model input throws schema validation error at API entry', () => {
    expect(() => {
      ClinicalQuestionEngine.evaluateNextQuestion({
        patient: { age: -5, gender: '' },
        symptoms: 'invalid',
        answers: {},
      });
    }).toThrow();
  });

  // 4. Missing model artifact triggers deterministic fallback
  it('4. Missing model artifact triggers automatic deterministic fallback without crashing', () => {
    MLQuestionRanker.setModelWeights(null); // Simulate missing model weights

    const request: NextQuestionApiRequest = {
      patient: { age: 30, gender: 'M' },
      symptoms: ['fever'],
      answers: {},
      regionalSignals: [],
    };

    const response = ClinicalQuestionEngine.evaluateNextQuestion(request);
    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.id).toBe('FEV_001');
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 5. ML model cannot bypass red-flag detection
  it('5. ML model cannot bypass red-flag detection when acute danger symptoms are present', () => {
    // Deliberately set biased weights to favor a non-safety question
    MLQuestionRanker.setModelWeights({
      modelType: 'AdversarialModel',
      version: 'test',
      bias: 0.0,
      weights: {
        q_is_FEV_001: 99.0, // High non-safety weight
        q_is_CARD_001: -99.0, // Low safety weight
      },
    });

    const symptoms = SymptomNormalizer.normalizeList(['acute chest pain']);
    const candidates = CLINICAL_QUESTION_GRAPH.filter((q) => q.id === 'CARD_001' || q.id === 'FEV_001');

    const ranked = MLQuestionRanker.rankCandidates(candidates, symptoms, {});
    // Deterministic safety override MUST elevate CARD_001 above FEV_001
    expect(ranked[0].question.id).toBe('CARD_001');
    expect(ranked[0].isRedFlagEscalated).toBe(true);
  });

  // 6. Red-flag questions remain highest priority when required
  it('6. Red-flag questions remain highest priority under dyspnea presentation', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 55, gender: 'F' },
      symptoms: ['shortness of breath', 'cough'],
      answers: {},
      regionalSignals: [],
    };

    const response = ClinicalQuestionEngine.evaluateNextQuestion(request);
    expect(response.nextQuestion?.id).toBe('RESP_001');
    expect(response.reason).toBe('red_flag_screening');
    expect(response.safetyFlags.some((f) => f.includes('dyspnea'))).toBe(true);
  });

  // 7. Already-asked questions remain excluded
  it('7. Already-asked questions are never re-evaluated or returned', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 40, gender: 'M' },
      symptoms: ['fever', 'cough'],
      answers: {
        RESP_001: 'no', // Already answered
      },
      regionalSignals: [],
    };

    const response = ClinicalQuestionEngine.evaluateNextQuestion(request);
    expect(response.nextQuestion?.id).not.toBe('RESP_001');
  });

  // 8. ML inference failure does not break patient flow
  it('8. ML inference failure does not break patient flow', () => {
    // Set corrupted weights object that throws during compute
    MLQuestionRanker.setModelWeights({} as any);

    const request: NextQuestionApiRequest = {
      patient: { age: 25, gender: 'F' },
      symptoms: ['cough'],
      answers: {},
      regionalSignals: [],
    };

    const response = ClinicalQuestionEngine.evaluateNextQuestion(request);
    expect(response.nextQuestion).not.toBeNull();
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 9. requiresDoctorReview remains true in all scenarios
  it('9. requiresDoctorReview invariant is strictly true in every evaluated state', () => {
    const req1: NextQuestionApiRequest = {
      patient: { age: 20, gender: 'M' },
      symptoms: ['fever'],
      answers: {},
      regionalSignals: [],
    };
    const res1 = ClinicalQuestionEngine.evaluateNextQuestion(req1);
    expect(res1.requiresDoctorReview).toBe(true);

    const req2: NextQuestionApiRequest = {
      patient: { age: 70, gender: 'F' },
      symptoms: ['chest pain'],
      answers: {},
      regionalSignals: [],
    };
    const res2 = ClinicalQuestionEngine.evaluateNextQuestion(req2);
    expect(res2.requiresDoctorReview).toBe(true);
  });

  // 10. Intake terminates cleanly when all candidate questions are answered
  it('10. Intake cleanly returns nextQuestion: null when candidate questions are exhausted', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 30, gender: 'M' },
      symptoms: ['routine'],
      answers: {
        RESP_001: 'no',
        RESP_002: 'no',
        RESP_003: 'no',
        CARD_001: 'no',
        CARD_002: 'no',
        FEV_001: 'no',
        FEV_002: 'no',
        DENGUE_001: 'no',
        GI_001: 'no',
        GI_002: 'no',
        NEURO_001: 'no',
      },
      regionalSignals: [],
    };

    const response = ClinicalQuestionEngine.evaluateNextQuestion(request);
    expect(response.nextQuestion).toBeNull();
    expect(response.reason).toBe('no_more_candidate_questions');
    expect(response.requiresDoctorReview).toBe(true);
  });
});
