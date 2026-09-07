import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/rfid/simulate', () => {
  it('identifies the seeded Demo Patient 001 card and broadcasts a session', async () => {
    const res = await request(app).post('/api/rfid/simulate').send({ uid: 'DEMO-RFID-001' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IDENTIFIED');
    expect(res.body.patientId).toBe('demo-patient-001');
    expect(res.body.ledColor).toBe('GREEN');
  });

  it('rejects a UID that has no registered card', async () => {
    const res = await request(app).post('/api/rfid/simulate').send({ uid: 'NOT-A-REAL-CARD' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/rfid/scan', () => {
  it('rejects requests without a valid device key', async () => {
    const res = await request(app)
      .post('/api/rfid/scan')
      .send({ deviceCode: 'TEST-KIOSK', uid: 'DEMO-RFID-001', timestamp: new Date().toISOString() });
    expect(res.status).toBe(401);
  });

  it('accepts requests with the correct device key', async () => {
    const res = await request(app)
      .post('/api/rfid/scan')
      .set('X-Device-Key', env.DEVICE_KEY)
      .send({ deviceCode: 'TEST-KIOSK', uid: 'DEMO-RFID-001', timestamp: new Date().toISOString() });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IDENTIFIED');
  });
});

describe('GET /api/rfid/patient/:uid', () => {
  it('returns not registered message for unknown card UID', async () => {
    const res = await request(app).get('/api/rfid/patient/UNKNOWN-99-99');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'RFID card is not registered',
    });
  });

  it('returns patient profile and encounter for a registered card UID', async () => {
    const res = await request(app).get('/api/rfid/patient/DEMO-RFID-001');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.patient).toBeDefined();
    expect(res.body.patient.id).toBe('demo-patient-001');
    expect(res.body.patient.fullName).toBe('Aarav Sharma');
    expect(res.body.card.uid).toBe('DEMO-RFID-001');
    expect(res.body.encounter).toBeDefined();
  });

  it('normalizes lowercase/unformatted UID and matches patient', async () => {
    const res = await request(app).get('/api/rfid/patient/demo-rfid-001');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.patient.fullName).toBe('Aarav Sharma');
  });

  it('successfully retrieves second demo card (DEMO-RFID-002 - Priya Verma)', async () => {
    const res = await request(app).get('/api/rfid/patient/DEMO-RFID-002');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.patient.fullName).toBe('Priya Verma');
    expect(res.body.patient.id).toBe('demo-patient-002');
  });
});

describe('GET /api/rfid/status', () => {
  it('reports current serial hardware reader state and configuration', async () => {
    const res = await request(app).get('/api/rfid/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('connected');
    expect(res.body).toHaveProperty('state');
    expect(res.body).toHaveProperty('port');
    expect(res.body).toHaveProperty('baudRate');
    expect(res.body).toHaveProperty('enabled');
  });
});

