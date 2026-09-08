import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Developer 1: POST /api/ai/next-question Endpoint', () => {
  it('returns next question with requiresDoctorReview: true for fever intake', async () => {
    const res = await request(app)
      .post('/api/ai/next-question')
      .send({
        patient: { age: 42, gender: 'M' },
        symptoms: ['fever', 'sore_throat'],
        answers: {},
        regionalSignals: [],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nextQuestion');
    expect(res.body.nextQuestion).not.toBeNull();
    expect(res.body.nextQuestion).toHaveProperty('id');
    expect(res.body.nextQuestion).toHaveProperty('text');
    expect(res.body.nextQuestion).toHaveProperty('priority');
    expect(res.body).toHaveProperty('reason');
    expect(Array.isArray(res.body.safetyFlags)).toBe(true);
    expect(res.body.requiresDoctorReview).toBe(true);
  });

  it('triggers red-flag screening for acute chest pain', async () => {
    const res = await request(app)
      .post('/api/ai/next-question')
      .send({
        patient: { age: 55, gender: 'M' },
        symptoms: ['acute chest pain'],
        answers: {},
        regionalSignals: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.nextQuestion.id).toBe('CARD_001');
    expect(res.body.reason).toBe('red_flag_screening');
    expect(res.body.safetyFlags.length).toBeGreaterThan(0);
    expect(res.body.requiresDoctorReview).toBe(true);
  });

  it('rejects invalid payload with HTTP 400 BAD_REQUEST', async () => {
    const res = await request(app)
      .post('/api/ai/next-question')
      .send({
        patient: { age: -10, gender: '' },
        symptoms: 'invalid_string_not_array',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('returns nextQuestion: null when question candidates are exhausted', async () => {
    const res = await request(app)
      .post('/api/ai/next-question')
      .send({
        patient: { age: 30, gender: 'F' },
        symptoms: ['general wellness check'],
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
      });

    expect(res.status).toBe(200);
    expect(res.body.nextQuestion).toBeNull();
    expect(res.body.reason).toBe('no_more_candidate_questions');
    expect(res.body.requiresDoctorReview).toBe(true);
  });
});
