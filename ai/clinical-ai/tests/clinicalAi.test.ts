import { describe, it, expect } from 'vitest';
import { SymptomNormalizer } from '../src/normalization/SymptomNormalizer.js';
import { NextBestQuestionRanker } from '../src/ranker/NextBestQuestionRanker.js';
import type { PatientState, RegionalSignal } from '../../shared/types/index.js';

describe('Developer 1: Clinical AI Engine', () => {
  it('normalizes vernacular and English symptom terms accurately', () => {
    const hindiFever = SymptomNormalizer.normalize('bukhar');
    expect(hindiFever).not.toBeNull();
    expect(hindiFever?.symptomCode).toBe('SYMPT_FEVER');

    const englishChestPain = SymptomNormalizer.normalize('acute severe chest pain');
    expect(englishChestPain).not.toBeNull();
    expect(englishChestPain?.symptomCode).toBe('SYMPT_CHEST_PAIN');
  });

  it('selects red-flag cardiac question when chest pain is reported', () => {
    const state: PatientState = {
      sessionId: 'sess_test_1',
      patientId: 'pat_test_1',
      demographics: { age: 55, gender: 'MALE' },
      chiefComplaint: 'Chest pain since morning',
      answeredQuestions: [],
    };

    const response = NextBestQuestionRanker.selectNextQuestion({ patientState: state });
    expect(response.nextQuestion).not.toBeNull();
    expect(response.nextQuestion?.questionId).toBe('Q_CARD_001');
    expect(response.nextQuestion?.redFlagTrigger).toBe(true);
    expect(response.isComplete).toBe(false);
  });

  it('elevates respiratory outbreak questions when region has COVID surge', () => {
    const state: PatientState = {
      sessionId: 'sess_test_2',
      patientId: 'pat_test_2',
      demographics: { age: 34, gender: 'FEMALE' },
      chiefComplaint: 'Mild fever and body ache',
      answeredQuestions: [],
    };

    const covidRegionalSignal: RegionalSignal = {
      regionId: 'DISTRICT_LUCKNOW',
      disease: 'COVID-19',
      riskLevel: 'HIGH',
      positivityRate: 0.15,
      sampleSize: 1200,
      trend: 'OUTBREAK_SURGE',
      confidence: 'HIGH_CONFIDENCE',
      generatedAt: new Date().toISOString(),
    };

    const response = NextBestQuestionRanker.selectNextQuestion({
      patientState: state,
      regionalSignal: covidRegionalSignal,
    });

    expect(response.nextQuestion).not.toBeNull();
    // Q_RESP_001 or Q_RESP_002 prioritized due to regional outbreak signal
    expect(response.nextQuestion?.relatedOutbreakDisease).toBe('COVID-19');
    expect(response.suspectedDifferentials.some((d) => d.diseaseName.includes('SARS-CoV-2'))).toBe(true);
  });

  it('marks completion when maximum intake questions are answered', () => {
    const state: PatientState = {
      sessionId: 'sess_test_3',
      patientId: 'pat_test_3',
      demographics: { age: 28, gender: 'MALE' },
      chiefComplaint: 'Routine wellness checkup',
      answeredQuestions: [
        { questionId: 'Q_CARD_001', answerValue: 'no', answeredAt: new Date().toISOString() },
        { questionId: 'Q_RESP_001', answerValue: 'no', answeredAt: new Date().toISOString() },
        { questionId: 'Q_RESP_002', answerValue: 'no', answeredAt: new Date().toISOString() },
        { questionId: 'Q_FEV_001', answerValue: 'no', answeredAt: new Date().toISOString() },
        { questionId: 'Q_DENGUE_001', answerValue: 'no', answeredAt: new Date().toISOString() },
        { questionId: 'Q_GI_001', answerValue: 'no', answeredAt: new Date().toISOString() },
      ],
    };

    const response = NextBestQuestionRanker.selectNextQuestion({ patientState: state });
    expect(response.isComplete).toBe(true);
    expect(response.nextQuestion).toBeNull();
    expect(response.remainingQuestionsEstimated).toBe(0);
  });
});
