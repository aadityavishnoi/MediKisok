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
});
