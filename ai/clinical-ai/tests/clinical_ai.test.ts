/**
 * Developer 1: Clinical AI Engine - Mandatory 10 Clinical Scenario Tests
 * Tests dynamic clinical cross-questioning, red-flag escalation, information gain,
 * and regional outbreak surveillance modifiers.
 */

import { describe, it, expect } from 'vitest';
import { ClinicalQuestionEngine } from '../inference/ClinicalQuestionEngine';
import { SymptomNormalizer } from '../preprocessing/normalize_symptoms';
import { NextQuestionApiRequest, NextQuestionApiResponse } from '../schemas/api_schema';
import { RegionalSignal } from '../schemas/regional_signal_schema';

describe('Developer 1: 10 Mandatory Clinical Questioning Scenarios', () => {
  // 1. Fever-only patient
  it('Scenario 1: Fever-only patient ranks fever chronometry and rigors next', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 32, gender: 'M' },
      symptoms: ['fever'],
      answers: {},
      regionalSignals: [],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.id).toBe('FEV_001');
    expect(response.nextQuestion?.text).toContain('How many days have you had the fever');
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 2. Fever + cough
  it('Scenario 2: Fever + cough ranks respiratory screening next', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 44, gender: 'F' },
      symptoms: ['fever', 'cough'],
      answers: {},
      regionalSignals: [],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    expect(response.nextQuestion).not.toBeNull();
    // Prioritizes dyspnea screening for acute respiratory presentations
    expect(response.nextQuestion?.id).toBe('RESP_001');
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 3. Fever + breathing difficulty (escalates red flag)
  it('Scenario 3: Fever + breathing difficulty triggers immediate red-flag escalation', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 62, gender: 'M' },
      symptoms: ['fever', 'difficulty breathing'],
      answers: {},
      regionalSignals: [],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.id).toBe('RESP_001');
    expect(response.nextQuestion?.priority).toBe('HIGH');
    expect(response.reason).toBe('red_flag_screening');
    expect(response.safetyFlags.some((f) => f.includes('dyspnea'))).toBe(true);
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 4. Fever + sore throat + elevated regional signal
  it('Scenario 4: Elevated regional signal prioritizes respiratory questions over routine inquiry', () => {
    const covidSignal: RegionalSignal = {
      regionId: 'DISTRICT_KANPUR',
      disease: 'COVID-19',
      riskLevel: 'HIGH',
      positivityRate: 0.19,
      trend: 'OUTBREAK_SURGE',
      confidence: 'HIGH_CONFIDENCE',
      generatedAt: new Date().toISOString(),
    };

    const request: NextQuestionApiRequest = {
      patient: { age: 29, gender: 'F' },
      symptoms: ['fever', 'sore throat'],
      answers: {},
      regionalSignals: [covidSignal],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.id).toBe('RESP_001');
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 5. Already-asked question (ensures never repeated)
  it('Scenario 5: Already-asked questions are never repeated', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 40, gender: 'M' },
      symptoms: ['fever', 'cough'],
      answers: {
        RESP_001: 'no', // Already answered dyspnea question
      },
      regionalSignals: [],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    expect(response.nextQuestion).not.toBeNull();
    // Must NOT be RESP_001 since already answered
    expect(response.nextQuestion?.id).not.toBe('RESP_001');
    // Advances to sputum character (RESP_002) or fever chronometry (FEV_001)
    expect(['RESP_002', 'FEV_001']).toContain(response.nextQuestion?.id);
  });

  // 6. No candidate question remaining
  it('Scenario 6: Returns nextQuestion: null with proper reason when questions exhausted', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 30, gender: 'M' },
      symptoms: ['routine checkup'],
      answers: {
        RESP_001: 'no',
        RESP_002: 'no_cough',
        RESP_003: 'no',
        CARD_001: 'no_localized',
        CARD_002: 'no',
        FEV_001: 'acute_1_to_3_days',
        FEV_002: 'no',
        DENGUE_001: 'no',
        GI_001: 'able_to_hydrate',
        GI_002: 'no_diffuse_mild',
        NEURO_001: 'no',
      },
      regionalSignals: [],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    expect(response.nextQuestion).toBeNull();
    expect(response.reason).toBe('no_more_candidate_questions');
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 7. Invalid input rejection
  it('Scenario 7: Rejects malformed or invalid inputs with validation error', () => {
    const invalidRequest = {
      patient: { age: -5, gender: '' }, // Negative age, empty gender
      symptoms: 'fever', // Should be an array
      answers: null,
    };

    expect(() => ClinicalQuestionEngine.evaluateNextQuestion(invalidRequest)).toThrow();
  });

  // 8. Missing regional signal fallback
  it('Scenario 8: Missing or empty regional signals execute cleanly without error', () => {
    const requestWithoutSignals: NextQuestionApiRequest = {
      patient: { age: 35, gender: 'F' },
      symptoms: ['headache'],
      answers: {},
      regionalSignals: [],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(requestWithoutSignals);

    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.id).toBe('NEURO_001');
    expect(response.requiresDoctorReview).toBe(true);
  });

  // 9. Low-confidence regional signal does not distort ranking
  it('Scenario 9: Low-confidence regional surveillance does not distort clinical ranking', () => {
    const lowConfidenceCovidSignal: RegionalSignal = {
      regionId: 'DISTRICT_SAMPLE',
      disease: 'COVID-19',
      riskLevel: 'CRITICAL',
      positivityRate: 0.80,
      confidence: 'LOW_CONFIDENCE', // Low sample size
      generatedAt: new Date().toISOString(),
    };

    const request: NextQuestionApiRequest = {
      patient: { age: 50, gender: 'M' },
      symptoms: ['fever'],
      answers: {},
      regionalSignals: [lowConfidenceCovidSignal],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    // Because confidence is LOW_CONFIDENCE, fever chronometry remains primary rather than skewed
    expect(response.nextQuestion?.id).toBe('FEV_001');
  });

  // 10. Red-flag escalation for acute chest pain
  it('Scenario 10: Acute chest pain triggers critical cardiac safety escalation', () => {
    const request: NextQuestionApiRequest = {
      patient: { age: 58, gender: 'M' },
      symptoms: ['acute chest pain radiating to left arm'],
      answers: {},
      regionalSignals: [],
    };

    const response: NextQuestionApiResponse = ClinicalQuestionEngine.evaluateNextQuestion(request);

    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.id).toBe('CARD_001');
    expect(response.reason).toBe('red_flag_screening');
    expect(response.safetyFlags.some((f) => f.includes('cardiac'))).toBe(true);
    expect(response.requiresDoctorReview).toBe(true);
  });
});
