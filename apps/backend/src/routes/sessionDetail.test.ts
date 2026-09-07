import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

async function loginAsDemoDoctor() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'demo.doctor@medikiosk.local', password: 'MediKiosk@123' });
  return res.body.token as string;
}

async function completeChestPainInterview() {
  const scan = await request(app).post('/api/rfid/simulate').send({ uid: 'DEMO-RFID-001' });
  const sessionId = scan.body.sessionId as string;
  await request(app).post('/api/consent').send({ sessionId, granted: true, language: 'EN' });
  await request(app)
    .post('/api/history/start')
    .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'chest-pain' });
  await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-1', answerValue: 'few_hours' });
  await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-2', answerValue: 'center' });
  await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-3', answerValue: 'pressure' });
  const severe = await request(app)
    .post('/api/history/answer')
    .send({ sessionId, nodeId: 'cp-4', answerValue: 'severe_7_10' });
  const alertId = (await prisma.alert.findFirst({ where: { sessionId }, orderBy: { createdAt: 'desc' } }))!.id;
  return { sessionId, alertId, severeResponse: severe.body };
}

describe('session status after a completed interview', () => {
  it('routes the session to the doctor (ROUTED) rather than an unimplemented DOCUMENTS stage', async () => {
    const token = await loginAsDemoDoctor();
    const scan = await request(app).post('/api/rfid/simulate').send({ uid: 'DEMO-RFID-001' });
    const sessionId = scan.body.sessionId as string;
    await request(app).post('/api/consent').send({ sessionId, granted: true, language: 'EN' });
    await request(app)
      .post('/api/history/start')
      .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'fever' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'fv-1', answerValue: 'under_1_day' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'fv-2', answerValue: 'under_38' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'fv-3', answerValue: 'no' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'fv-4', answerValue: ['none'] });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-1', answerValue: ['none'] });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-2', answerValue: 'None' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-3', answerValue: 'None' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-4', answerValue: 'None' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-5', answerValue: ['none'] });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-6', answerValue: ['none'] });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-7', answerValue: ['none'] });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cs-8', answerValue: 'None' });

    const dashboard = await request(app).get('/api/doctor/dashboard').set('Authorization', `Bearer ${token}`);
    const row = dashboard.body.sessions.find((s: { sessionId: string }) => s.sessionId === sessionId);
    expect(row.status).toBe('ROUTED');
  });
});

describe('GET /api/doctor/sessions/:sessionId', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/doctor/sessions/does-not-matter');
    expect(res.status).toBe(401);
  });

  it('returns the full structured history, consent, and alerts for a session', async () => {
    const token = await loginAsDemoDoctor();
    const { sessionId } = await completeChestPainInterview();

    const res = await request(app).get(`/api/doctor/sessions/${sessionId}`).set('Authorization', `Bearer ${token}`);
    expect(['Demo Patient 001', 'Aarav Sharma']).toContain(res.body.patient.fullName);
    expect(res.body.consent.status).toBe('GRANTED');
    expect(res.body.history.chiefComplaint).toBe('Chest pain');
    expect(res.body.history.hpi.length).toBeGreaterThan(0);
    expect(res.body.alerts.length).toBe(1);
    expect(res.body.alerts[0].acknowledged).toBe(false);
  });

  it('returns 404 for an unknown session', async () => {
    const token = await loginAsDemoDoctor();
    const res = await request(app).get('/api/doctor/sessions/not-a-real-session').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/doctor/alerts/:alertId/acknowledge', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/doctor/alerts/does-not-matter/acknowledge');
    expect(res.status).toBe(401);
  });

  it('marks the alert acknowledged and records who acknowledged it', async () => {
    const token = await loginAsDemoDoctor();
    const { sessionId, alertId } = await completeChestPainInterview();

    const ack = await request(app).post(`/api/doctor/alerts/${alertId}/acknowledge`).set('Authorization', `Bearer ${token}`);
    expect(ack.status).toBe(200);
    expect(ack.body.acknowledged).toBe(true);

    const detail = await request(app).get(`/api/doctor/sessions/${sessionId}`).set('Authorization', `Bearer ${token}`);
    const alert = detail.body.alerts.find((a: { id: string }) => a.id === alertId);
    expect(alert.acknowledged).toBe(true);
    expect(alert.acknowledgedByDoctorId).toBeTruthy();
  });

  it('returns 404 for an unknown alert', async () => {
    const token = await loginAsDemoDoctor();
    const res = await request(app).post('/api/doctor/alerts/not-a-real-alert/acknowledge').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
