import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Developer 2: Surveillance & Rx Endpoints Integration', () => {
  const app = createApp();

  // Test 1: GET /api/surveillance/regions/:regionId/risk (Demo 8/10 Mode)
  it('GET /api/surveillance/regions/REGION_X/risk returns controlled 8/10 outbreak signal', async () => {
    const res = await request(app).get('/api/surveillance/regions/REGION_X/risk');
    expect(res.status).toBe(200);
    expect(res.body.regionId).toBe('REGION_X');
    expect(res.body.signals).toBeDefined();

    const covidSignal = res.body.signals.find((s: any) => s.disease === 'COVID-19');
    expect(covidSignal).toBeDefined();
    expect(covidSignal.sampleSize).toBe(10);
    expect(covidSignal.positivityRate).toBe(0.8);
    expect(covidSignal.riskLevel).toBe('CRITICAL');
    expect(covidSignal.confidence).toBe('LOW_SAMPLE');
    expect(covidSignal.wilsonInterval).toBeDefined();
    expect(covidSignal.bayesSmoothedRate).toBeLessThan(0.8);
  });

  // Test 2: POST /api/rx/check (Interaction detection & Jan Aushadhi)
  it('POST /api/rx/check identifies drug interactions and Jan Aushadhi generic equivalents', async () => {
    const res = await request(app)
      .post('/api/rx/check')
      .send({
        medications: ['Ecosprin 75', 'Warfarin 5mg'],
        allergies: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.safe).toBe(false);
    expect(res.body.requiresDoctorReview).toBe(true);
    expect(res.body.interactions.length).toBeGreaterThan(0);
    expect(res.body.normalizedDrugs.length).toBe(2);
    expect(res.body.janAushadhiAlternatives.length).toBeGreaterThanOrEqual(1);
    expect(res.body.regulatoryMetadata.nlemCount).toBe(2);
  });

  // Test 3: POST /api/rx/check (Unknown drug zero hallucinations)
  it('POST /api/rx/check flags unknown drug without hallucinating', async () => {
    const res = await request(app)
      .post('/api/rx/check')
      .send({
        medications: ['CompletelyUnknownCompound999'],
        allergies: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.requiresDoctorReview).toBe(true);
    expect(res.body.normalizedDrugs[0].isUnknown).toBe(true);
    expect(res.body.normalizedDrugs[0].genericName).toBe('UNKNOWN');
    expect(res.body.regulatoryMetadata.unknownCount).toBe(1);
  });
});
