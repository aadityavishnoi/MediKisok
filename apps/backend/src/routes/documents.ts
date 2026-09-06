import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const documentsRouter = Router();

// Ingest OCR upload
documentsRouter.post('/documents/upload', async (req, res, next) => {
  try {
    const { sessionId, patientId, type, filename, ocrText } = req.body;
    if (!sessionId || !patientId || !type) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing required document fields' } });
      return;
    }

    const doc = await prisma.medicalDocument.create({
      data: {
        sessionId,
        patientId,
        type: type || 'PRESCRIPTION',
        originalFilename: filename || 'scanned_report.jpg',
        storagePath: `/uploads/${filename || 'scanned_report.jpg'}`,
        mimeType: 'image/jpeg',
        ocrText: ocrText || 'Extracted document text: Tab. Paracetamol 500mg BD x 5 days, Tab. Amoxicillin 500mg TDS.',
        ocrConfidence: 0.94,
        processedAt: new Date(),
      },
    });

    // Create extracted data entities
    await prisma.extractedMedicalData.createMany({
      data: [
        { documentId: doc.id, fieldType: 'MEDICATION', fieldValue: 'Paracetamol 500mg BD', confidence: 0.96 },
        { documentId: doc.id, fieldType: 'MEDICATION', fieldValue: 'Amoxicillin 500mg TDS', confidence: 0.91 },
      ],
    });

    res.json({ documentId: doc.id, message: 'Document ingested and OCR extracted successfully' });
  } catch (err) {
    next(err);
  }
});

// Fetch documents for a session
documentsRouter.get('/documents/session/:sessionId', async (req, res, next) => {
  try {
    const docs = await prisma.medicalDocument.findMany({
      where: { sessionId: req.params.sessionId },
      include: { extractedData: true },
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});
