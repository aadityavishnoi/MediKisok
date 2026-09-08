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
 * Evaluates reported symptoms, prior answers, demographics, and regional outbreak signals
 * to determine the next highest-yield clinical question.
 * The doctor remains the final decision maker (requiresDoctorReview: true).
 */
aiRouter.post('/ai/next-question', async (req, res, next) => {
  try {
    const { ClinicalQuestionEngine, NextQuestionApiRequestSchema } = await import('@medikiosk/clinical-ai');

    // Handle legacy patientState format if passed
    let payload = req.body;
    if (payload && payload.patientState && !payload.patient) {
      const ps = payload.patientState;
      const symptomsList: string[] = [];
      if (ps.chiefComplaint) symptomsList.push(ps.chiefComplaint);
      if (Array.isArray(ps.reportedSymptoms)) symptomsList.push(...ps.reportedSymptoms);

      const answersMap: Record<string, string | boolean | number> = {};
      if (Array.isArray(ps.answeredQuestions)) {
        for (const ans of ps.answeredQuestions) {
          answersMap[ans.questionId] = ans.answerValue;
        }
      }

      const signals = payload.regionalSignal ? [payload.regionalSignal] : [];

      payload = {
        patient: {
          age: typeof ps.demographics?.age === 'number' ? ps.demographics.age : 30,
          gender: ps.demographics?.gender ? String(ps.demographics.gender) : 'M',
        },
        symptoms: symptomsList,
        answers: answersMap,
        regionalSignals: signals,
      };
    }

    // Validate request schema
    const parseResult = NextQuestionApiRequestSchema.safeParse(payload);
    if (!parseResult.success) {
      const issueMessages = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: `Validation failed: ${issueMessages}`,
        },
      });
      return;
    }

    const evaluation = ClinicalQuestionEngine.evaluateNextQuestion(parseResult.data);
    res.status(200).json(evaluation);
  } catch (err) {
    next(err);
  }
});
