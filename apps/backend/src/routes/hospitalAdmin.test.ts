import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Hospital Admin API Suite', () => {
  it('GET /api/hospital/overview returns facility and executive metrics', async () => {
    const res = await request(app).get('/api/hospital/overview');
    expect(res.status).toBe(200);
    expect(res.body.facility).toBeDefined();
    expect(res.body.facility.code).toBe('HOSP-DEL-AIIMS');
    expect(res.body.metrics).toBeDefined();
    expect(typeof res.body.metrics.todayIntake).toBe('number');
    expect(typeof res.body.metrics.doctorsOnDuty).toBe('number');
    expect(Array.isArray(res.body.doctors)).toBe(true);
    expect(Array.isArray(res.body.kiosks)).toBe(true);
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });

  it('GET /api/hospital/departments returns OPD clinics list', async () => {
    const res = await request(app).get('/api/hospital/departments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/hospital/doctors returns doctor roster entries', async () => {
    const res = await request(app).get('/api/hospital/doctors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/hospital/kiosks returns hardware fleet telemetry', async () => {
    const res = await request(app).get('/api/hospital/kiosks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/hospital/kiosks/:code/mode updates kiosk operational mode', async () => {
    const res = await request(app)
      .patch('/api/hospital/kiosks/KSK-DEL-014/mode')
      .send({ mode: 'AYUSH Mode' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.terminalCode).toBe('KSK-DEL-014');
    expect(res.body.mode).toBe('AYUSH_MODE');
  });

  it('GET /api/hospital/rfid-inventory returns local stock allocations', async () => {
    const res = await request(app).get('/api/hospital/rfid-inventory');
    expect(res.status).toBe(200);
    expect(typeof res.body.totalAllocated).toBe('number');
    expect(typeof res.body.availableStock).toBe('number');
    expect(typeof res.body.issuedToPatients).toBe('number');
  });

  it('GET /api/hospital/his-integration returns FHIR R4 gateway telemetry', async () => {
    const res = await request(app).get('/api/hospital/his-integration');
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(true);
    expect(res.body.fhirGateway).toBeDefined();
    expect(res.body.abdmMilestones).toBeDefined();
  });

  it('GET /api/hospital/incidents returns maintenance tickets', async () => {
    const res = await request(app).get('/api/hospital/incidents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
