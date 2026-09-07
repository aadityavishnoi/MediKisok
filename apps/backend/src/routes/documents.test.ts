import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/prisma.js';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('ImageKit Documents & OCR API Pipeline', () => {
  it('uploads a prescription document to ImageKit and stores OCR data in CockroachDB', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .send({
        patientId: 'demo-patient-001',
        type: 'PRESCRIPTION',
        filename: 'prescription_test.png',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.document).toBeDefined();
    expect(res.body.document.patientId).toBe('demo-patient-001');
    expect(res.body.document.storagePath).toContain('imagekit.io');
    expect(res.body.document.extractedData.length).toBeGreaterThan(0);
    expect(res.body.imagekit).toBeDefined();
    expect(res.body.imagekit.url).toContain('imagekit.io');

    const docId = res.body.documentId;

    // Verify retrieval by patient
    const patientDocsRes = await request(app).get('/api/documents/patient/demo-patient-001');
    expect(patientDocsRes.status).toBe(200);
    expect(patientDocsRes.body.documents.some((d: any) => d.id === docId)).toBe(true);
  });

  it('rejects upload request without sessionId and without patientId', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .send({
        type: 'PRESCRIPTION',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});
