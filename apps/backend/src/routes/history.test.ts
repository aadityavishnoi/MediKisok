import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

async function identifyDemoPatient() {
  const res = await request(app).post('/api/rfid/simulate').send({ uid: 'DEMO-RFID-001' });
  return res.body.sessionId as string;
}

describe('consent gating', () => {
  it('blocks history/start until consent is granted, then allows it', async () => {
    const sessionId = await identifyDemoPatient();

    const blocked = await request(app)
      .post('/api/history/start')
      .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'fever' });
    expect(blocked.status).toBe(403);

    const consent = await request(app).post('/api/consent').send({ sessionId, granted: true, language: 'EN' });
    expect(consent.status).toBe(200);
    expect(consent.body.status).toBe('GRANTED');

    const allowed = await request(app)
      .post('/api/history/start')
      .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'fever' });
    expect(allowed.status).toBe(200);
    expect(allowed.body.question.nodeId).toBe('fv-1');
  });

  it('marks the session ABANDONED when consent is declined', async () => {
    const sessionId = await identifyDemoPatient();
    const consent = await request(app).post('/api/consent').send({ sessionId, granted: false, language: 'EN' });
    expect(consent.body.status).toBe('DECLINED');

    const blocked = await request(app)
      .post('/api/history/start')
      .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'fever' });
    expect(blocked.status).toBe(403);
  });
});

describe('red flag pipeline', () => {
  it('creates a persisted Alert and returns redFlag when a severe option is chosen', async () => {
    const sessionId = await identifyDemoPatient();
    await request(app).post('/api/consent').send({ sessionId, granted: true, language: 'EN' });
    await request(app)
      .post('/api/history/start')
      .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'chest-pain' });

    // Walk to cp-4 (severity) quickly.
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-1', answerValue: 'few_hours' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-2', answerValue: 'center' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-3', answerValue: 'pressure' });
    const res = await request(app)
      .post('/api/history/answer')
      .send({ sessionId, nodeId: 'cp-4', answerValue: 'severe_7_10' });

    expect(res.body.redFlag).not.toBeNull();
    expect(res.body.redFlag.severity).toBe('HIGH');

    const alerts = await prisma.alert.findMany({ where: { sessionId } });
    expect(alerts.length).toBe(1);
    expect(alerts[0].triggerType).toBe('OPTION_FLAGGED');
  });

  it('does not create an Alert for a mild answer', async () => {
    const sessionId = await identifyDemoPatient();
    await request(app).post('/api/consent').send({ sessionId, granted: true, language: 'EN' });
    await request(app)
      .post('/api/history/start')
      .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'chest-pain' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-1', answerValue: 'few_hours' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-2', answerValue: 'center' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-3', answerValue: 'pressure' });
    const res = await request(app)
      .post('/api/history/answer')
      .send({ sessionId, nodeId: 'cp-4', answerValue: 'mild_1_3' });

    expect(res.body.redFlag).toBeNull();
    const alerts = await prisma.alert.findMany({ where: { sessionId } });
    expect(alerts.length).toBe(0);
  });
});
