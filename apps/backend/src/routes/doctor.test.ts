import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

/**
 * Abandon any active sessions for demo patients before each test to prevent
 * session deduplication from returning stale sessions across tests.
 */
async function resetDemoPatientSessions() {
  try {
    await prisma.patientSession.updateMany({
      where: {
        patientId: 'demo-patient-001',
        status: { notIn: ['COMPLETED', 'ABANDONED'] },
      },
      data: { status: 'ABANDONED' },
    });
  } catch {
    // DB may be offline; demoStore sessions are ephemeral so no cleanup needed
  }
}

beforeEach(resetDemoPatientSessions);

afterAll(async () => {
  await prisma.$disconnect();
});

async function loginAsDemoDoctor() {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'demo.doctor@medikiosk.local', password: 'MediKiosk@123' });
  return res.body.token as string;
}

describe('POST /api/auth/login', () => {
  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@medikiosk.local', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.doctor@medikiosk.local', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('issues a token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo.doctor@medikiosk.local', password: 'MediKiosk@123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.role).toBe('DOCTOR');
  });
});

describe('GET /api/doctor/dashboard', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/doctor/dashboard');
    expect(res.status).toBe(401);
  });

  it('lists sessions for an authenticated doctor, including chief complaint and alert severity', async () => {
    const token = await loginAsDemoDoctor();

    const scan = await request(app).post('/api/rfid/simulate').send({ uid: 'DEMO-RFID-001' });
    const sessionId = scan.body.sessionId as string;
    await request(app).post('/api/consent').send({ sessionId, granted: true, language: 'EN' });
    await request(app)
      .post('/api/history/start')
      .send({ sessionId, mode: 'GENERAL', chiefComplaintCategory: 'chest-pain' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-1', answerValue: 'few_hours' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-2', answerValue: 'center' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-3', answerValue: 'pressure' });
    await request(app).post('/api/history/answer').send({ sessionId, nodeId: 'cp-4', answerValue: 'severe_7_10' });

    const dashboard = await request(app).get('/api/doctor/dashboard').set('Authorization', `Bearer ${token}`);
    expect(dashboard.status).toBe(200);
    const row = dashboard.body.sessions.find((s: { sessionId: string }) => s.sessionId === sessionId);
    expect(row).toBeTruthy();
    expect(row.chiefComplaint).toBe('Chest pain');
    expect(row.highestAlertSeverity).toBe('HIGH');
  });
});
