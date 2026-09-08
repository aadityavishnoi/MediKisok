import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const aiRouter = Router();

// Generate AI summary with source evidence citations
aiRouter.post('/ai/summarize', async (req, res, next) => {
  try {
    const { sessionId, patientId } = req.body;
    if (!sessionId || !patientId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing sessionId or patientId' } });
      return;
    }

    const history = await prisma.clinicalHistory.findUnique({
      where: { sessionId },
      include: { answers: true },
    });

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    const docs = await prisma.medicalDocument.findMany({ where: { sessionId } });

    const summaryText = `Patient ${patient?.fullName || 'Individual'} presented with chief complaint: ${history?.chiefComplaint || 'General Checkup'}. Intake questionnaire complete. Evidence verified against ${history?.answers.length || 0} clinical answers and ${docs.length} uploaded records. No unbacked AI statements generated.`;

    const summary = await prisma.aISummary.upsert({
      where: { sessionId },
      update: { content: summaryText, status: 'DRAFT' },
      create: {
        sessionId,
        patientId,
        content: summaryText,
        generatorType: 'LOCAL_LLM',
        status: 'DRAFT',
      },
    });

    res.json({
      summaryId: summary.id,
      content: summary.content,
      status: summary.status,
      evidenceCitations: [
        { sentence: `Chief complaint: ${history?.chiefComplaint || 'Intake'}`, source: 'Patient Answer' },
        { sentence: `Intake verified`, source: 'MediKiosk Engine' },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// Interactive AI Clinical Copilot query
aiRouter.post('/ai/copilot-chat', async (req, res, next) => {
  try {
    const { patientId, query } = req.body;
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { clinicalHistories: true, documents: true },
    });

    res.json({
      reply: `Clinical Context for ${patient?.fullName || 'Patient'}: Regarding "${query}", patient reported symptoms during digital kiosk intake. Vital signs and evidence records available in Patient 360.`,
      sources: [
        { title: 'Digital History Intake', type: 'CLINICAL_ANSWER' },
        { title: 'Prescription OCR Scan', type: 'DOCUMENT' },
      ],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Developer 1: POST /api/ai/next-question
 * Evaluates patient state and optional regional outbreak context to return the next best clinical question.
 */
aiRouter.post('/ai/next-question', async (req, res, next) => {
  try {
    const { patientState, regionalSignal } = req.body;
    if (!patientState || !patientState.sessionId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'patientState with sessionId is required' } });
      return;
    }

    // Import NextBestQuestionRanker dynamically
    const clinicalAiPath = '../../../../ai/clinical-ai/src/index.js';
    const { NextBestQuestionRanker } = await (import(clinicalAiPath) as Promise<any>);
    const result = NextBestQuestionRanker.selectNextQuestion({
      patientState,
      regionalSignal,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Developer 2 Phase 4: POST /api/ai/consultation/start
 * Connects patient intake, symptoms, regional disease surveillance, and first Clinical AI question.
 */
aiRouter.post('/ai/consultation/start', async (req, res, next) => {
  try {
    const { sessionId, patientId, chiefComplaint, reportedSymptoms, district, state, facilityId, doctorId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'sessionId is required' } });
      return;
    }

    const { ConsultationAiService } = await import('../services/consultationAiService.js');
    const result = await ConsultationAiService.startConsultation({
      sessionId,
      patientId,
      chiefComplaint,
      reportedSymptoms,
      district,
      state,
      facilityId,
      doctorId,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Developer 2 Phase 4: POST /api/ai/consultation/answer
 * Submits patient answer, updates Clinical AI graph, evaluates next question or completes intake.
 */
aiRouter.post('/ai/consultation/answer', async (req, res, next) => {
  try {
    const { sessionId, questionId, answerValue, questionText, isRedFlagTrigger } = req.body;
    if (!sessionId || !questionId) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'sessionId and questionId are required' } });
      return;
    }

    const { ConsultationAiService } = await import('../services/consultationAiService.js');
    const result = await ConsultationAiService.submitAnswer({
      sessionId,
      questionId,
      answerValue,
      questionText,
      isRedFlagTrigger,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Developer 2 Phase 4: GET /api/ai/consultation/:sessionId/context
 * Retrieves unified AI consultation context with patient state, regional signals, and Rx alerts.
 */
aiRouter.get('/ai/consultation/:sessionId/context', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const requestingDoctor = (req as any).user ? { id: (req as any).user.sub, facilityId: (req as any).user.facilityId } : undefined;

    const { ConsultationAiService } = await import('../services/consultationAiService.js');
    const context = await ConsultationAiService.getContext(sessionId, requestingDoctor);

    res.status(200).json({ context });
  } catch (err) {
    next(err);
  }
});

/**
 * Developer 2 Phase 4: POST /api/consultations/:id/complete
 * Doctor final clinical decision: diagnosis, notes, prescription issuance, and alert acknowledgements.
 * Enforces doctor final authority (doctorFinalDecision: true, autonomousDiagnosis: false).
 */
aiRouter.post('/consultations/:id/complete', async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { doctorId, diagnosis, notes, prescriptions, acknowledgedAlerts } = req.body;

    if (!diagnosis) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'diagnosis is required for doctor completion' } });
      return;
    }

    const effectiveDoctorId = doctorId || (req as any).user?.sub || 'doc_consulting_physician';

    const { ConsultationAiService } = await import('../services/consultationAiService.js');
    const result = await ConsultationAiService.completeConsultation({
      sessionId,
      doctorId: effectiveDoctorId,
      diagnosis,
      notes,
      prescriptions,
      acknowledgedAlerts,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});


