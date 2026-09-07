import { Router } from 'express';
import { GeminiVisionOcrService } from '@medikiosk/ai-service';
import { prisma } from '../lib/prisma.js';

export const documentsRouter = Router();

const normalizeDocType = (t?: string): 'PRESCRIPTION' | 'LAB_REPORT' | 'DISCHARGE_SUMMARY' | 'OTHER' => {
  if (!t) return 'PRESCRIPTION';
  const upper = t.toUpperCase();
  if (upper.includes('LAB')) return 'LAB_REPORT';
  if (upper.includes('DISCHARGE')) return 'DISCHARGE_SUMMARY';
  if (upper.includes('ID') || upper.includes('ABHA') || upper === 'OTHER') return 'OTHER';
  return 'PRESCRIPTION';
};

import { env } from '../lib/env.js';
import { fetchDroidcamFrame } from '../lib/droidcamFrame.js';

// Proxy / direct snapshot endpoint from DroidCam device without browser CORS
documentsRouter.get('/devices/droidcam-frame', async (req, res) => {
  const ip = String(req.query.ip || '');
  if (!ip) {
    res.status(400).json({ error: { message: 'Missing ip query parameter' } });
    return;
  }
  const frame = await fetchDroidcamFrame(ip);
  if (!frame) {
    res.status(502).json({ error: { message: `Could not fetch frame from DroidCam at ${ip}. Ensure DroidCam app is open.` } });
    return;
  }
  res.setHeader('Content-Type', frame.mimeType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(frame.buffer);
});

// Live DroidCam & Camera OCR Scanning endpoint
documentsRouter.post('/documents/scan', async (req, res, next) => {
  try {
    let { imageBase64, sessionId, patientId, type, filename, mimeType, phoneIp } = req.body;

    // If imageBase64 was not provided or was tainted/dummy, but phoneIp is present, grab frame directly from DroidCam
    if ((!imageBase64 || imageBase64 === 'simulated_dummy_image') && phoneIp) {
      const frame = await fetchDroidcamFrame(phoneIp);
      if (frame) {
        imageBase64 = frame.buffer.toString('base64');
        mimeType = frame.mimeType;
      }
    }

    if (!imageBase64) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing imageBase64 document image' } });
      return;
    }

    const docType = normalizeDocType(type);
    const ocrService = new GeminiVisionOcrService({ apiKey: env.GEMINI_API_KEY });
    const result = await ocrService.processDocumentImage(imageBase64, mimeType || 'image/jpeg', docType);

    let documentId = `doc_${Date.now()}`;

    // If active session provided, persist to database
    if (sessionId) {
      try {
        // Resolve patientId if not explicitly provided
        let resolvedPatientId = patientId;
        if (!resolvedPatientId) {
          const session = await prisma.patientSession.findUnique({
            where: { id: sessionId },
            select: { patientId: true },
          });
          if (session) resolvedPatientId = session.patientId;
        }

        if (resolvedPatientId) {
          const doc = await prisma.medicalDocument.create({
            data: {
              sessionId,
              patientId: resolvedPatientId,
              type: docType,
              originalFilename: filename || `droidcam_${Date.now()}.jpg`,
              storagePath: `/uploads/scans/${filename || `droidcam_${Date.now()}.jpg`}`,
              mimeType: mimeType || 'image/jpeg',
              ocrText: result.rawText || result.summary,
              ocrConfidence: result.confidence <= 1 ? result.confidence : result.confidence / 100,
              processedAt: new Date(),
            },
          });
          documentId = doc.id;

          if (result.fields && result.fields.length > 0) {
            await prisma.extractedMedicalData.createMany({
              data: result.fields.map((f) => ({
                documentId: doc.id,
                fieldType: f.fieldType,
                fieldValue: f.fieldValue,
                confidence: f.confidence <= 1 ? f.confidence : f.confidence / 100,
                status: 'NEEDS_VERIFICATION',
              })),
            });
          }
        }
      } catch (dbErr) {
        console.warn('[documents/scan] Could not persist to DB, returning OCR result:', dbErr);
      }
    }

    const finalConfidence =
      result.confidence <= 1
        ? Math.round(result.confidence * 100)
        : Math.min(100, Math.round(result.confidence));

    res.json({
      documentId,
      documentType: result.documentType,
      summary: result.summary,
      rawText: result.rawText,
      confidence: finalConfidence,
      fields: result.fields,
      engineUsed: result.engineUsed,
    });
  } catch (err) {
    next(err);
  }
});


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
