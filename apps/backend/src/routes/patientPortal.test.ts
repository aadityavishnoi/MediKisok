import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Patient Portal API Suite', () => {
  it('POST /api/patient/auth/register validates required fields and password length', async () => {
    const res = await request(app).post('/api/patient/auth/register').send({
      fullName: 'A',
      phone: '123',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/patient/auth/login rejects empty credentials', async () => {
    const res = await request(app).post('/api/patient/auth/login').send({
      identifier: '',
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/patient/profile rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patient/profile');
    expect(res.status).toBe(401);
  });

  it('GET /api/patient/dashboard rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patient/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /api/patient/appointments rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patient/appointments');
    expect(res.status).toBe(401);
  });

  it('GET /api/patient/billing rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patient/billing');
    expect(res.status).toBe(401);
  });

  it('GET /api/patient/available-slots returns available departments, doctors, and time slots', async () => {
    const res = await request(app).get('/api/patient/available-slots');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.departments)).toBe(true);
    expect(Array.isArray(res.body.doctors)).toBe(true);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('GET /api/patient/reports rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patient/reports');
    expect(res.status).toBe(401);
  });

  it('GET /api/patient/prescriptions rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patient/prescriptions');
    expect(res.status).toBe(401);
  });

  it('GET /api/patient/notifications rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/patient/notifications');
    expect(res.status).toBe(401);
  });

  it('GET /api/patient/reports/:id rejects unauthorized IDOR access to non-existent or other patient reports with 404', async () => {
    // Generate valid token for Patient A
    const jwt = (await import('jsonwebtoken')).default;
    const { env } = await import('../lib/env.js');
    const tokenPatientA = jwt.sign(
      { sub: 'patient-a-mock-id', role: 'PATIENT', name: 'Patient A' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get('/api/patient/reports/unauthorized-report-id-999')
      .set('Authorization', `Bearer ${tokenPatientA}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/patient/prescriptions/:id rejects unauthorized IDOR access with 404', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const { env } = await import('../lib/env.js');
    const tokenPatientA = jwt.sign(
      { sub: 'patient-a-mock-id', role: 'PATIENT', name: 'Patient A' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get('/api/patient/prescriptions/unauthorized-rx-id-999')
      .set('Authorization', `Bearer ${tokenPatientA}`);
    expect(res.status).toBe(404);
  });

  it('POST /api/patient/appointments rejects booking on past dates with 400', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const { env } = await import('../lib/env.js');
    const token = jwt.sign(
      { sub: 'patient-test-id', role: 'PATIENT', name: 'Test Patient' },
      env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        appointmentDate: '2020-01-01',
        timeSlot: '10:00 AM',
        reason: 'General Checkup',
      });
    expect(res.status).toBe(400);
  });
});
