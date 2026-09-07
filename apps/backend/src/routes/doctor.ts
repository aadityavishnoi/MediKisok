import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireDoctorAuth, type RequestWithDoctor } from '../middleware/doctorAuth.js';
import {
  completeConsultation,
  getDoctorDashboard,
  getSessionDetail,
  reviewAISummary,
  startConsultation,
} from '../services/doctorDashboardService.js';
import { acknowledgeAlert } from '../services/alertService.js';

export const doctorRouter = Router();

doctorRouter.get(
  '/doctor/dashboard',
  requireDoctorAuth,
  asyncHandler(async (_req, res) => {
    const result = await getDoctorDashboard();
    res.status(200).json(result);
  }),
);

doctorRouter.get(
  '/doctor/sessions/:sessionId',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const result = await getSessionDetail(req.params.sessionId);
    res.status(200).json(result);
  }),
);

const acknowledgeSchema = z.object({ alertId: z.string().min(1) });

doctorRouter.post(
  '/doctor/alerts/:alertId/acknowledge',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const { alertId } = acknowledgeSchema.parse({ alertId: req.params.alertId });
    const doctorId = (req as RequestWithDoctor).doctor!.sub;
    const result = await acknowledgeAlert(alertId, doctorId);
    res.status(200).json(result);
  }),
);

doctorRouter.post(
  '/doctor/sessions/:sessionId/consultation/start',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const doctorId = (req as RequestWithDoctor).doctor?.sub;
    const result = await startConsultation(req.params.sessionId, doctorId);
    res.status(200).json(result);
  }),
);

const prescriptionItemSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().default(''),
  frequency: z.string().default(''),
  duration: z.string().default(''),
  instructions: z.string().default(''),
});

const completeConsultationSchema = z.object({
  notes: z.string().optional(),
  prescriptions: z.array(prescriptionItemSchema).default([]),
  labOrders: z.array(z.string()).default([]),
  followUpDate: z.string().optional(),
});

doctorRouter.post(
  '/doctor/sessions/:sessionId/consultation/complete',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const doctorId = (req as RequestWithDoctor).doctor?.sub;
    const body = completeConsultationSchema.parse(req.body);
    const result = await completeConsultation(req.params.sessionId, doctorId, body);
    res.status(200).json(result);
  }),
);

const reviewSummarySchema = z.object({
  action: z.enum(['ACCEPT', 'EDIT', 'REJECT']),
  editedContent: z.string().optional(),
});

doctorRouter.put(
  '/doctor/sessions/:sessionId/summary',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const doctorId = (req as RequestWithDoctor).doctor?.sub;
    const body = reviewSummarySchema.parse(req.body);
    const result = await reviewAISummary(req.params.sessionId, doctorId, body);
    res.status(200).json(result);
  }),
);

const copilotChatSchema = z.object({
  query: z.string().min(1),
});

doctorRouter.post(
  '/doctor/sessions/:sessionId/copilot-chat',
  requireDoctorAuth,
  asyncHandler(async (req, res) => {
    const { query } = copilotChatSchema.parse(req.body);
    const detail = await getSessionDetail(req.params.sessionId);

    const lower = query.toLowerCase();
    let reply = `Regarding "${query}": `;
    const sources: Array<{ title: string; type: string; snippet?: string }> = [];

    if (lower.includes('allerg') || lower.includes('reaction')) {
      const allergies = detail.history?.drugAllergies || [];
      if (allergies.length > 0) {
        reply += `Patient has reported allergies: ${allergies.map((a) => `${a.label}: ${a.value}`).join(', ')}.`;
        sources.push({ title: 'Drug Allergies Intake', type: 'CLINICAL_ANSWER' });
      } else {
        reply += 'No known drug allergies reported during kiosk intake.';
      }
    } else if (lower.includes('medication') || lower.includes('drug') || lower.includes('rx') || lower.includes('tablet')) {
      const meds = detail.history?.currentMedications || [];
      const docMeds = (detail.documents || []).flatMap((d) => d.extractedData.filter((e) => e.fieldType.toUpperCase().includes('MED')));
      reply += `Current medications from intake: ${meds.map((m) => `${m.label}: ${m.value}`).join(', ') || 'None reported'}. `;
      if (docMeds.length > 0) {
        reply += `Prescription OCR extracted: ${docMeds.map((m) => m.fieldValue).join(', ')}.`;
        sources.push({ title: 'Prescription OCR Scans', type: 'DOCUMENT' });
      }
      sources.push({ title: 'Patient Medication Intake', type: 'CLINICAL_ANSWER' });
    } else if (lower.includes('chest') || lower.includes('pain') || lower.includes('symptom') || lower.includes('complaint')) {
      reply += `Chief Complaint is "${detail.history?.chiefComplaint || 'Routine Visit'}". `;
      const hpi = detail.history?.hpi || [];
      if (hpi.length > 0) {
        reply += `HPI findings: ${hpi.map((h) => `${h.label}: ${h.value}`).join('; ')}.`;
      }
      sources.push({ title: 'HPI Intake Questionnaire', type: 'CLINICAL_ANSWER' });
    } else {
      reply += `Patient ${detail.patient.fullName} (${detail.patient.gender || 'Unknown gender'}) presented with "${detail.history?.chiefComplaint || 'General checkup'}". Digital questionnaire complete with ${detail.documents?.length || 0} verified medical document(s).`;
      sources.push({ title: 'Kiosk Clinical Summary', type: 'SUMMARY' });
    }

    res.status(200).json({ reply, sources });
  }),
);

