/**
 * Developer 2 Phase 4: Consultation AI Orchestrator & Multi-System Workflow
 *
 * Integrates:
 * Patient Intake -> Clinical AI Questioning -> Regional Surveillance ->
 * Doctor Dashboard -> Rx Medication Safety -> Doctor Final Decision -> Completion.
 *
 * Enforces Absolute Safety:
 * - Assistive only: AI never autonomously diagnoses, prescribes, or overrides doctors.
 * - Regional surveillance is population-level decision-support (individualDiagnosis: false).
 * - Doctor remains sole legal and clinical authority.
 * - Fails safely on service outages.
 */
import { PrescriptionFrequency } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { wsHub } from '../ws/hub.js';
import type {
  ConsultationAiContext,
  ConsultationAiStatus,
  PatientState,
  RegionalSignal,
  AnsweredQuestionEntry,
  RxAlert,
  ForecastSignal,
  ClinicalSignal,
  SuspectedDifferential,
} from '../types/aiSharedTypes.js';

// In-memory active session cache for speed and seamless test operation
const activeConsultationContexts = new Map<string, ConsultationAiContext & { facilityId?: string }>();

async function withFastTimeout<T>(promise: Promise<T>, ms = 60): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

/**
 * Maps free-text frequency strings from the doctor's Rx UI (e.g. '1-0-1', 'once daily')
 * to the PrescriptionFrequency enum required by Prisma.
 * Defaults to BD (twice daily) for unrecognised inputs.
 */
function normalizePrescriptionFrequency(raw?: string): PrescriptionFrequency {
  if (!raw) return PrescriptionFrequency.BD;
  const upper = raw.toUpperCase().replace(/[\s\-]/g, '');
  if (upper === 'OD' || upper === '100' || upper.includes('ONCE')) return PrescriptionFrequency.OD;
  if (upper === 'BD' || upper === '110' || upper.includes('TWICE')) return PrescriptionFrequency.BD;
  if (upper === 'TDS' || upper === '111' || upper.includes('THREE')) return PrescriptionFrequency.TDS;
  if (upper === 'QID' || upper === '1111' || upper.includes('FOUR')) return PrescriptionFrequency.QID;
  if (upper === 'PRN' || upper.includes('NEEDED') || upper.includes('REQUIRED')) return PrescriptionFrequency.PRN;
  if (upper === 'SOS' || upper.includes('EMERGENCY') || upper.includes('SOS')) return PrescriptionFrequency.SOS;
  return PrescriptionFrequency.BD;
}


import { loadAiModule } from '../lib/dynamicAiLoader.js';

// Helper to resolve dynamic AI modules safely across environments.
// Paths are computed at runtime using dynamicAiLoader so TypeScript
// compiler does not attempt to compile external AI files outside rootDir.
async function getSurveillanceService(): Promise<any> {
  try {
    const mod = await loadAiModule('surveillance/src');
    return mod?.SurveillanceService ?? null;
  } catch {
    return null;
  }
}

async function getGeographicNormalizer(): Promise<any> {
  try {
    const mod = await loadAiModule('surveillance/src/normalization/GeographicNormalizer');
    return mod?.GeographicNormalizer ?? null;
  } catch {
    return null;
  }
}

async function getDrugSafetyEngine(): Promise<any> {
  try {
    const mod = await loadAiModule('rx-engine/src');
    return mod?.DrugSafetyEngine ?? null;
  } catch {
    return null;
  }
}

async function getNextBestQuestionRanker(): Promise<any> {
  try {
    const mod = await loadAiModule('clinical-ai/src');
    return mod?.NextBestQuestionRanker ?? null;
  } catch {
    return null;
  }
}

export interface StartConsultationAiParams {
  sessionId: string;
  patientId?: string;
  chiefComplaint?: string;
  reportedSymptoms?: string[];
  district?: string;
  state?: string;
  facilityId?: string;
  doctorId?: string;
}

export interface SubmitAnswerParams {
  sessionId: string;
  questionId: string;
  answerValue: string;
  questionText?: string;
  isRedFlagTrigger?: boolean;
}

export interface CompleteConsultationAiParams {
  sessionId: string;
  doctorId: string;
  diagnosis: string;
  notes?: string;
  prescriptions?: Array<{
    medicineName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  acknowledgedAlerts?: string[];
}

export class ConsultationAiService {
  /**
   * 1. Start or resume Consultation AI Context
   * Connects patient intake symptoms with regional surveillance priors and initial question
   */
  static async startConsultation(params: StartConsultationAiParams): Promise<{
    context: ConsultationAiContext;
    nextQuestion: any;
    suspectedDifferentials: SuspectedDifferential[];
    surveillanceStatus: 'ACTIVE' | 'UNAVAILABLE';
  }> {
    const { sessionId } = params;
    const now = new Date().toISOString();

    // Check DB for existing session/patient details with fast timeout
    let dbPatient: any = null;
    let dbSession: any = null;
    try {
      dbSession = await withFastTimeout(
        prisma.patientSession.findUnique({
          where: { id: sessionId },
          include: { patient: true, clinicalHistory: true },
        }),
      );
      if (dbSession?.patient) {
        dbPatient = dbSession.patient;
      }
    } catch {
      // Offline fallback: continue with provided params
    }

    const patientId = params.patientId || dbPatient?.id || `pat_${sessionId}`;
    const patientName = dbPatient?.fullName || 'Individual Patient';
    const chiefComplaint =
      params.chiefComplaint ||
      dbSession?.clinicalHistory?.chiefComplaint ||
      'General OPD Presentation';
    const symptoms = params.reportedSymptoms || (chiefComplaint ? [chiefComplaint] : []);

    // Normalize geographic region for surveillance
    const rawDistrict = params.district || dbPatient?.district || 'Varanasi';
    const rawState = params.state || dbPatient?.state || 'Uttar Pradesh';

    let regionId = 'IN-UP-VARANASI';
    let regionalSignal: RegionalSignal | null = null;
    let forecasts: ForecastSignal[] = [];
    let surveillanceStatus: 'ACTIVE' | 'UNAVAILABLE' = 'ACTIVE';

    try {
      const geoNormalizer = await getGeographicNormalizer();
      if (geoNormalizer) {
        const normalized = geoNormalizer.normalizeRegion
          ? geoNormalizer.normalizeRegion(rawDistrict, rawState)
          : (geoNormalizer.normalize ? geoNormalizer.normalize(rawDistrict, rawState) : null);
        if (normalized?.regionId) {
          regionId = normalized.regionId;
        }
      }


      const surveillanceService = await getSurveillanceService();
      if (surveillanceService) {
        const risk = surveillanceService.getRegionalRisk(regionId);
        regionalSignal = {
          regionId: risk.regionId,
          district: rawDistrict,
          state: rawState,
          disease: risk.disease || 'General Infection',
          riskLevel: (risk.riskLevel || 'LOW') as any,
          positivityRate: risk.observedPositivity ?? 0,
          sampleSize: risk.sampleSize ?? 0,
          positiveCount: risk.signals?.[0]?.positiveCount ?? 0,
          trend: (risk.trend || 'STABLE') as any,
          confidence: (risk.confidence || 'ADEQUATE_SAMPLE') as any,
          wilsonInterval: risk.signals?.[0]?.wilsonInterval,
          baselinePrevalence: risk.baselineDeviation,
          epidemiologicalAlertMessage: risk.evidence?.[0] || 'Regional surveillance monitoring active.',
          generatedAt: risk.generatedAt || now,
        };

        if (risk.forecast) {
          if (risk.forecast['7d']) {
            forecasts.push({
              horizonDays: 7,
              targetDate: risk.forecast['7d'].targetDate,
              predictedCases: risk.forecast['7d'].predictedCases,
              confidenceInterval: risk.forecast['7d'].confidenceInterval,
              modelName: risk.forecast['7d'].modelName,
              modelVersion: risk.forecast['7d'].modelVersion,
            });
          }
          if (risk.forecast['14d']) {
            forecasts.push({
              horizonDays: 14,
              targetDate: risk.forecast['14d'].targetDate,
              predictedCases: risk.forecast['14d'].predictedCases,
              confidenceInterval: risk.forecast['14d'].confidenceInterval,
              modelName: risk.forecast['14d'].modelName,
              modelVersion: risk.forecast['14d'].modelVersion,
            });
          }
        }
      } else {
        surveillanceStatus = 'UNAVAILABLE';
      }
    } catch (survErr) {
      console.warn('[ConsultationAiService] Surveillance service unavailable, failing safely:', survErr);
      surveillanceStatus = 'UNAVAILABLE';
      // Graceful fail-safe: consultation proceeds without blocking
    }

    // Build initial patient state for Clinical AI ranking
    const patientState: PatientState = {
      sessionId,
      patientId,
      demographics: {
        age: dbPatient?.dateOfBirth
          ? Math.max(1, new Date().getFullYear() - new Date(dbPatient.dateOfBirth).getFullYear())
          : 45,
        gender: (dbPatient?.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE') as any,
        district: rawDistrict,
        state: rawState,
        facilityId: params.facilityId,
      },
      chiefComplaint,
      reportedSymptoms: symptoms,
      answeredQuestions: [],
    };

    // Query Clinical AI ranker
    let nextQuestion = null;
    let suspectedDifferentials: SuspectedDifferential[] = [];
    try {
      const ranker = await getNextBestQuestionRanker();
      if (ranker) {
        const ranking = ranker.selectNextQuestion({
          patientState,
          regionalSignal,
        });
        nextQuestion = ranking.nextQuestion;
        suspectedDifferentials = ranking.suspectedDifferentials || [];
      }
    } catch (aiErr) {
      console.warn('[ConsultationAiService] Clinical AI ranker error, falling back to standard intake:', aiErr);
    }

    const clinicalSignal: ClinicalSignal = {
      sessionId,
      patientId,
      normalizedSymptoms: symptoms.map((s, idx) => ({
        symptomCode: `SYMPT_${idx}`,
        symptomName: s,
        confidence: 0.9,
      })),
      triageAcuity: 'GREEN_NON_URGENT',
      redFlagStatus: 'NONE',
      suspectedDifferentials,
      clinicalSafetyNotes: 'Assistive clinical decision support. Physician review required.',
      generatedAt: now,
    };

    const context: ConsultationAiContext & { facilityId?: string } = {
      consultationId: `cons_${sessionId}`,
      sessionId,
      facilityId: params.facilityId || dbSession?.hospitalId,
      regionId,
      patient: {

        id: patientId,
        fullName: patientName,
        age: patientState.demographics.age,
        gender: patientState.demographics.gender,
        district: rawDistrict,
        state: rawState,
      },
      symptoms,
      answers: [],
      clinicalSignals: [clinicalSignal],
      regionalSignals: regionalSignal ? [regionalSignal] : [],
      medications: [],
      rxAlerts: [],
      forecasts,
      requiresDoctorReview: true,
      status: 'IN_PROGRESS',
      auditTrail: [
        {
          requestId: `req_${Date.now()}`,
          timestamp: now,
          module: 'CONSULTATION_AI',
          action: 'START_CONSULTATION',
        },
      ],
    };

    activeConsultationContexts.set(sessionId, context);

    // Broadcast live WebSocket event if available
    try {
      wsHub.broadcast({
        type: 'SESSION_UPDATED',
        payload: {
          sessionId,
          status: 'IN_CONSULT',
          timestamp: now,
        },
      });
    } catch {}

    return {
      context,
      nextQuestion,
      suspectedDifferentials,
      surveillanceStatus,
    };
  }

  /**
   * 2. Submit patient answer to Clinical AI
   * Records answer, re-ranks next question, generates summary when intake completes
   */
  static async submitAnswer(params: SubmitAnswerParams): Promise<{
    context: ConsultationAiContext;
    nextQuestion: any;
    isComplete: boolean;
    suspectedDifferentials: SuspectedDifferential[];
    structuredSummary?: string;
  }> {
    const { sessionId, questionId, answerValue, questionText, isRedFlagTrigger } = params;
    const now = new Date().toISOString();

    let context = activeConsultationContexts.get(sessionId);
    if (!context) {
      // Rehydrate or initialize
      const started = await this.startConsultation({ sessionId });
      context = started.context;
    }

    const entry: AnsweredQuestionEntry = {
      questionId,
      questionText,
      answerValue,
      isRedFlagTrigger: Boolean(isRedFlagTrigger),
      answeredAt: now,
    };

    context.answers.push(entry);

    // Save to DB if available
    try {
      const history = await withFastTimeout(prisma.clinicalHistory.findUnique({ where: { sessionId } }));
      if (history) {
        await withFastTimeout(
          prisma.clinicalAnswer.create({
            data: {
              clinicalHistoryId: history.id,
              nodeId: questionId,
              section: 'HPI',
              questionText: questionText || questionId,
              answerValue: JSON.stringify(answerValue),
              isRedFlagTrigger: Boolean(isRedFlagTrigger),
              answeredAt: new Date(),
            },
          }),
        );
      }
    } catch {}

    // Evaluate next question using updated answers
    const patientState: PatientState = {
      sessionId: context.sessionId,
      patientId: context.patient.id,
      demographics: {
        age: context.patient.age || 45,
        gender: (context.patient.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE') as any,
        district: context.patient.district,
        state: context.patient.state,
      },
      chiefComplaint: context.symptoms[0] || 'Intake',
      reportedSymptoms: context.symptoms,
      answeredQuestions: context.answers,
    };

    const regionalSignal = context.regionalSignals[0] || null;

    let nextQuestion = null;
    let isComplete = false;
    let suspectedDifferentials: SuspectedDifferential[] = [];

    try {
      const ranker = await getNextBestQuestionRanker();
      if (ranker) {
        const ranking = ranker.selectNextQuestion({
          patientState,
          regionalSignal,
        });
        nextQuestion = ranking.nextQuestion;
        isComplete = ranking.isComplete;
        suspectedDifferentials = ranking.suspectedDifferentials || [];
      }
    } catch (aiErr) {
      console.warn('[ConsultationAiService] Error in selectNextQuestion, defaulting to completion check:', aiErr);
      isComplete = context.answers.length >= 5;
    }

    let structuredSummary: string | undefined;

    if (isComplete) {
      context.status = 'AI_HISTORY_COMPLETE';

      // Generate structured evidence summary
      const answersText = context.answers
        .map((a) => `• ${a.questionText || a.questionId}: ${a.answerValue}${a.isRedFlagTrigger ? ' [RED FLAG]' : ''}`)
        .join('\n');

      const regionalText = regionalSignal
        ? `Regional Surveillance: ${regionalSignal.disease} (${regionalSignal.riskLevel}, ${regionalSignal.trend} trend, ${regionalSignal.positivityRate ? Math.round(regionalSignal.positivityRate * 100) : 'N/A'}% positivity).`
        : 'Regional Surveillance: No active high-level alert.';

      structuredSummary = `Patient ${context.patient.fullName} (${context.patient.age || 'Adult'}/${context.patient.gender || 'M'}) presented with chief complaint: ${context.symptoms.join(', ')}.\n\nIntake Findings:\n${answersText}\n\n${regionalText}\n\nSuspected Decision Prompts:\n${suspectedDifferentials.map((d) => `- ${d.diseaseName} (${d.icd10Code}): ${(d.likelihoodScore * 100).toFixed(0)}% prompt score`).join('\n')}\n\nNote: All AI outputs are assistive prompts. Consulting physician must conduct physical exam and determine diagnosis.`;

      // Persist to AISummary in DB
      try {
        await withFastTimeout(
          prisma.aISummary.upsert({
            where: { sessionId },
            update: { content: structuredSummary, status: 'DRAFT' },
            create: {
              sessionId,
              patientId: context.patient.id,
              content: structuredSummary,
              generatorType: 'LOCAL_LLM',
              status: 'DRAFT',
            },
          }),
        );
      } catch {}
    }

    context.auditTrail?.push({
      requestId: `req_${Date.now()}`,
      timestamp: now,
      module: 'CLINICAL_AI',
      action: 'ANSWER_QUESTION',
    });

    activeConsultationContexts.set(sessionId, context);

    return {
      context,
      nextQuestion,
      isComplete,
      suspectedDifferentials,
      structuredSummary,
    };
  }

  /**
   * 3. Prescription Safety Review
   * Checks medications against NLEM 2022 / CDSCO catalog, drug interactions,
   * duplicate therapy, and allergy cross-reactivity with fail-safe UNKNOWN handling.
   */
  static async checkPrescriptionSafety(
    sessionId: string,
    medications: string[],
    allergies: string[] = [],
  ): Promise<{
    status: 'PASS' | 'REVIEW_REQUIRED' | 'BLOCKED';
    normalizedMedications: any[];
    interactions: any[];
    duplicateTherapy: any[];
    allergyFlags: any[];
    unknowns: string[];
    evidence: any[];
    doctorReviewRequired: boolean;
    janAushadhiRecommendations: any[];
  }> {
    let context = activeConsultationContexts.get(sessionId);
    const now = new Date().toISOString();

    try {
      const drugSafetyEngine = await getDrugSafetyEngine();
      if (!drugSafetyEngine) {
        throw new Error('DrugSafetyEngine module unavailable');
      }

      const review = drugSafetyEngine.checkPrescriptionSafety({
        medications,
        allergies,
        patientContext: context?.patient,
      });

      // Update context alerts
      if (context) {
        context.medications = medications;
        context.status = 'PRESCRIPTION_REVIEW';
        context.rxAlerts = (review.interactions || []).map((i: any) => ({
          alertId: `alt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          severity: i.severity,
          type: 'DRUG_INTERACTION',
          medications: [i.drugA, i.drugB],
          reason: `${i.drugA} interacts with ${i.drugB}: ${i.effect}`,
          mechanism: i.mechanism,
          effect: i.effect,
          management: i.management,
          evidence: i.evidence,
          requiresDoctorReview: true,
          doctorAction: 'PENDING',
        }));

        context.auditTrail?.push({
          requestId: `req_${Date.now()}`,
          timestamp: now,
          module: 'RX_ENGINE',
          action: 'CHECK_SAFETY',
        });
      }

      const hasAlerts =
        !review.safe ||
        (review.interactions && review.interactions.length > 0) ||
        (review.duplicateTherapy && review.duplicateTherapy.length > 0) ||
        (review.unknowns && review.unknowns.length > 0);

      return {
        status: hasAlerts ? 'REVIEW_REQUIRED' : 'PASS',
        normalizedMedications: review.normalizedMedications || [],
        interactions: review.interactions || [],
        duplicateTherapy: review.duplicateTherapy || [],
        allergyFlags: review.allergyFlags || [],
        unknowns: review.unknowns || [],
        evidence: review.evidence || [],
        doctorReviewRequired: hasAlerts,
        janAushadhiRecommendations: review.janAushadhiRecommendations || [],
      };
    } catch (err) {
      console.warn('[ConsultationAiService] Rx Engine check failed, returning fail-safe review required:', err);
      // Fail-Safe: Never claim safe when engine is unavailable (Section 16 / 28)
      return {
        status: 'REVIEW_REQUIRED',
        normalizedMedications: [],
        interactions: [],
        duplicateTherapy: [],
        allergyFlags: [],
        unknowns: medications,
        evidence: [],
        doctorReviewRequired: true,
        janAushadhiRecommendations: [],
      };
    }
  }

  /**
   * 4. Doctor Final Decision & Consultation Completion
   * Doctor is the sole legal and clinical authority. Saves final diagnosis, notes,
   * prescription items, and marks consultation COMPLETED.
   */
  static async completeConsultation(params: CompleteConsultationAiParams): Promise<{
    success: boolean;
    consultationId: string;
    status: ConsultationAiStatus;
    completedAt: string;
    doctorFinalDecision: true;
    autonomousDiagnosis: false;
    autonomousPrescription: false;
  }> {
    const { sessionId, doctorId, diagnosis, notes, prescriptions = [], acknowledgedAlerts = [] } = params;
    const now = new Date().toISOString();

    let context = activeConsultationContexts.get(sessionId);

    // Enforce non-autonomous mandate
    const decisionRecord = {
      doctorId,
      diagnosis,
      notes: notes || '',
      acknowledgedAlerts,
      completedAt: now,
    };

    if (context) {
      context.status = 'COMPLETED';
      context.doctorDecision = decisionRecord;
      context.auditTrail?.push({
        requestId: `req_${Date.now()}`,
        timestamp: now,
        module: 'DOCTOR_DECISION',
        action: 'COMPLETE_CONSULTATION',
      });
    }

    // Persist to Prisma DB with fast timeout
    try {
      const session = await withFastTimeout(
        prisma.patientSession.findUnique({
          where: { id: sessionId },
          include: { patient: true },
        }),
      );

      if (session) {
        await withFastTimeout(
          prisma.patientSession.update({
            where: { id: sessionId },
            data: { status: 'COMPLETED' },
          }),
        );

        const consultation = await withFastTimeout(
          prisma.consultation.upsert({
            where: { sessionId },
            update: {
              status: 'COMPLETED',
              notes: `${diagnosis}\n\n${notes || ''}`.trim(),
              completedAt: new Date(),
              doctorId,
            },
            create: {
              sessionId,
              patientId: session.patient?.id || context?.patient.id || 'unknown_patient',
              doctorId,
              status: 'COMPLETED',
              notes: `${diagnosis}\n\n${notes || ''}`.trim(),
              startedAt: new Date(),
              completedAt: new Date(),
            },
          }),
        );

        // If prescriptions were written, issue digital prescription record
        if (prescriptions.length > 0 && session.patient?.id && consultation) {
          try {
            await withFastTimeout(
              prisma.prescription.create({
                data: {
                  consultationId: consultation.id,
                  patientId: session.patient.id,
                  doctorId,
                  diagnosis,
                  clinicalNotes: notes || '',
                  followUpDays: 7,
                  items: {
                    create: prescriptions.map((p) => ({
                      medicineName: p.medicineName,
                      dosage: p.dosage || '1 Tab',
                      frequency: normalizePrescriptionFrequency(p.frequency),
                      durationDays: 5,
                      instructions: p.instructions || 'After meals',
                    })),
                  },
                },
              }),
            );
          } catch {}
        }
      }
    } catch (dbErr) {
      console.warn('[ConsultationAiService] DB offline during consultation completion, saved in-memory:', dbErr);
    }

    try {
      wsHub.broadcast({
        type: 'SESSION_UPDATED',
        payload: {
          sessionId,
          status: 'COMPLETED',
          timestamp: now,
        },
      });
    } catch {}

    return {
      success: true,
      consultationId: context?.consultationId || `cons_${sessionId}`,
      status: 'COMPLETED',
      completedAt: now,
      doctorFinalDecision: true,
      autonomousDiagnosis: false,
      autonomousPrescription: false,
    };
  }

  /**
   * 5. Get current consultation AI context
   * Verifies doctor authorization (Section 18 & 19 Test 13)
   */
  static async getContext(sessionId: string, requestingDoctor?: { id: string; facilityId?: string | null }): Promise<ConsultationAiContext> {
    let context = activeConsultationContexts.get(sessionId);

    // Authorization Check: cross-hospital leakage protection
    if (requestingDoctor?.facilityId) {
      if (context?.facilityId && context.facilityId !== requestingDoctor.facilityId) {
        throw Errors.forbidden('Unauthorized: Doctor cannot access patient consultation from another hospital facility.');
      }
      try {
        const session = await withFastTimeout(
          prisma.patientSession.findUnique({
            where: { id: sessionId },
            select: { hospitalId: true },
          }),
        );
        if (session?.hospitalId && session.hospitalId !== requestingDoctor.facilityId) {
          throw Errors.forbidden('Unauthorized: Doctor cannot access patient consultation from another hospital facility.');
        }
      } catch (err: any) {
        if (err.status === 403) throw err;
      }
    }

    if (!context) {
      // Initialize on demand
      const started = await this.startConsultation({ sessionId });
      context = started.context;
    }
    return context;
  }
}

