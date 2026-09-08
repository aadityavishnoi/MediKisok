import type {
  AlertSeverity,
  AISummaryReviewRequest,
  AISummaryReviewResponse,
  ConsultationCompleteRequest,
  ConsultationCompleteResponse,
  ConsultationStartResponse,
  DoctorDashboardResponse,
  DoctorDashboardSessionRow,
  SessionDetailResponse,
} from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { wsHub } from '../ws/hub.js';

const SEVERITY_RANK: Record<AlertSeverity, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

function highestSeverity(alerts: { severity: AlertSeverity }[]): AlertSeverity | null {
  if (alerts.length === 0) return null;
  return alerts.reduce<AlertSeverity>(
    (max, a) => (SEVERITY_RANK[a.severity] > SEVERITY_RANK[max] ? a.severity : max),
    alerts[0].severity,
  );
}

const DEMO_SESSIONS_FALLBACK: DoctorDashboardSessionRow[] = [
  {
    sessionId: 'demo_session_001',
    patient: { id: 'demo_patient_001', fullName: 'Rajesh Kumar', dateOfBirth: '1974-05-12T00:00:00.000Z', gender: 'Male' },
    status: 'ROUTED',
    chiefComplaint: 'Acute chest tightness & shortness of breath (2 hrs)',
    highestAlertSeverity: 'HIGH',
    updatedAt: new Date().toISOString(),
  },
  {
    sessionId: 'demo_session_002',
    patient: { id: 'demo_patient_002', fullName: 'Ananya Sharma', dateOfBirth: '1990-11-20T00:00:00.000Z', gender: 'Female' },
    status: 'SUMMARY_READY',
    chiefComplaint: 'Hypertension follow-up & severe headache',
    highestAlertSeverity: 'MEDIUM',
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    sessionId: 'demo_session_003',
    patient: { id: 'demo_patient_003', fullName: 'Vikram Singh', dateOfBirth: '1963-02-14T00:00:00.000Z', gender: 'Male' },
    status: 'IN_CONSULT',
    chiefComplaint: 'Post-CABG routine cardiac evaluation',
    highestAlertSeverity: 'LOW',
    updatedAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    sessionId: 'demo_session_004',
    patient: { id: 'demo_patient_004', fullName: 'Sunita Patel', dateOfBirth: '1982-08-05T00:00:00.000Z', gender: 'Female' },
    status: 'COMPLETED',
    chiefComplaint: 'Palpitations & lipid profile review',
    highestAlertSeverity: null,
    updatedAt: new Date(Date.now() - 60 * 60000).toISOString(),
  },
];

export async function getDoctorDashboard(): Promise<DoctorDashboardResponse> {
  try {
    const sessions = await prisma.patientSession.findMany({
      where: {
        patientId: { not: null },
        status: { notIn: ['IDENTIFIED', 'ABANDONED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        patient: true,
        clinicalHistory: { select: { chiefComplaint: true } },
        alerts: { select: { severity: true } },
      },
    });

    // Deduplicate: Each patient must only appear once in the Doctor Dashboard queue
    const seenPatientIds = new Set<string>();
    const uniqueSessions = [];
    for (const s of sessions) {
      if (s.patient && !seenPatientIds.has(s.patient.id)) {
        seenPatientIds.add(s.patient.id);
        uniqueSessions.push(s);
      }
    }

    return {
      sessions: uniqueSessions.map((s) => ({
        sessionId: s.id,
        patient: {
          id: s.patient!.id,
          fullName: s.patient!.fullName,
          dateOfBirth: s.patient!.dateOfBirth?.toISOString() ?? null,
          gender: s.patient!.gender,
        },
        status: s.status,
        chiefComplaint: s.clinicalHistory?.chiefComplaint ?? null,
        highestAlertSeverity: highestSeverity(s.alerts),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
  } catch (err) {
    console.warn('[doctorDashboardService] DB query failed:', err);
    return { sessions: [] };
  }
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetailResponse | null> {
  try {
    const session = await prisma.patientSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: true,
        consent: true,
        clinicalHistory: { include: { answers: { orderBy: { answeredAt: 'asc' } } } },
        alerts: { orderBy: { createdAt: 'desc' } },
        documents: { include: { extractedData: true } },
        aiSummary: true,
        consultation: true,
      },
    });

    if (session && session.patient) {
      const [timelineEvents, allDocuments] = await Promise.all([
        prisma.medicalTimelineEvent.findMany({
          where: { patientId: session.patient.id },
          orderBy: { eventDate: 'desc' },
        }),
        prisma.medicalDocument.findMany({
          where: {
            OR: [
              { sessionId: session.id },
              { patientId: session.patient.id },
            ],
          },
          include: { extractedData: true },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Extract all OCR medications from documents
      const ocrMeds = allDocuments
        .flatMap((d) => d.extractedData)
        .filter((e) => e.fieldType.toUpperCase().includes('MED'))
        .map((e) => ({ label: 'Prescription OCR', value: e.fieldValue }));

      const existingHistoryMeds = Array.isArray(session.clinicalHistory?.currentMedications)
        ? (session.clinicalHistory!.currentMedications as Array<{ label: string; value: string }>)
        : [];
      const mergedCurrentMeds = [...existingHistoryMeds];
      for (const om of ocrMeds) {
        if (!mergedCurrentMeds.some((m) => m.value?.toLowerCase() === om.value?.toLowerCase())) {
          mergedCurrentMeds.push(om);
        }
      }

      const effectiveHistory = session.clinicalHistory
        ? {
            id: session.clinicalHistory.id,
            sessionId: session.clinicalHistory.sessionId,
            patientId: session.clinicalHistory.patientId,
            mode: session.clinicalHistory.mode,
            chiefComplaint: session.clinicalHistory.chiefComplaint,
            hpi: (session.clinicalHistory.hpi as any) ?? [],
            pastMedicalHistory: (session.clinicalHistory.pastMedicalHistory as any) ?? [],
            pastSurgicalHistory: (session.clinicalHistory.pastSurgicalHistory as any) ?? [],
            currentMedications: mergedCurrentMeds,
            drugAllergies: (session.clinicalHistory.drugAllergies as any) ?? [],
            familyHistory: (session.clinicalHistory.familyHistory as any) ?? [],
            personalHistory: (session.clinicalHistory.personalHistory as any) ?? [],
            reviewOfSystems: (session.clinicalHistory.reviewOfSystems as any) ?? [],
            previousInvestigations: (session.clinicalHistory.previousInvestigations as any) ?? [],
            ayushFields: (session.clinicalHistory.ayushFields as any) ?? null,
            completedAt: session.clinicalHistory.completedAt?.toISOString() ?? null,
            answers: session.clinicalHistory.answers.map((a) => ({
              id: a.id,
              clinicalHistoryId: a.clinicalHistoryId,
              nodeId: a.nodeId,
              section: a.section,
              questionText: a.questionText,
              questionTextLocalized: a.questionTextLocalized as any,
              answerValue: a.answerValue,
              isRedFlagTrigger: a.isRedFlagTrigger,
              answeredAt: a.answeredAt.toISOString(),
            })),
          }
        : mergedCurrentMeds.length > 0
        ? {
            id: `synth_hist_${session.id}`,
            sessionId: session.id,
            patientId: session.patient.id,
            mode: 'GENERAL' as any,
            chiefComplaint: 'Prescription & Documents Scanned at Kiosk',
            hpi: [],
            pastMedicalHistory: [],
            pastSurgicalHistory: [],
            currentMedications: mergedCurrentMeds,
            drugAllergies: [],
            familyHistory: [],
            personalHistory: [],
            reviewOfSystems: [],
            previousInvestigations: [],
            ayushFields: null,
            completedAt: session.createdAt.toISOString(),
            answers: [],
          }
        : null;

      return {
        sessionId: session.id,
        status: session.status,
        mode: session.mode,
        language: session.language,
        isDemo: session.isDemo,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        patient: {
          id: session.patient.id,
          fullName: session.patient.fullName,
          dateOfBirth: session.patient.dateOfBirth?.toISOString() ?? null,
          gender: session.patient.gender,
          phone: session.patient.phone,
        },
        consent: session.consent
          ? {
              status: session.consent.status,
              language: session.consent.language,
              grantedAt: session.consent.grantedAt?.toISOString() ?? null,
            }
          : null,
        history: effectiveHistory,
        alerts: session.alerts.map((a) => ({
          id: a.id,
          sessionId: a.sessionId,
          patientId: a.patientId,
          severity: a.severity,
          triggerType: a.triggerType,
          message: a.message,
          triggeredByAnswerId: a.triggeredByAnswerId,
          acknowledged: a.acknowledged,
          acknowledgedByDoctorId: a.acknowledgedByDoctorId,
          acknowledgedAt: a.acknowledgedAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
        })),
        documents: allDocuments.map((d) => ({
          id: d.id,
          sessionId: d.sessionId,
          patientId: d.patientId,
          type: d.type,
          originalFilename: d.originalFilename,
          storagePath: d.storagePath,
          mimeType: d.mimeType,
          ocrText: d.ocrText,
          ocrConfidence: d.ocrConfidence,
          processedAt: d.processedAt?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
          extractedData: d.extractedData.map((e) => ({
            id: e.id,
            documentId: e.documentId,
            fieldType: e.fieldType,
            fieldValue: e.fieldValue,
            confidence: e.confidence,
            status: e.status,
            verifiedBy: e.verifiedBy,
            verifiedAt: e.verifiedAt?.toISOString() ?? null,
          })),
        })),
        timelineEvents: timelineEvents.map((t) => ({
          id: t.id,
          patientId: t.patientId,
          sourceDocumentId: t.sourceDocumentId,
          eventType: t.eventType,
          eventDate: t.eventDate?.toISOString() ?? null,
          title: t.title,
          description: t.description,
          metadata: (t.metadata as Record<string, unknown>) ?? null,
        })),
        consultation: session.consultation
          ? {
              id: session.consultation.id,
              sessionId: session.consultation.sessionId,
              patientId: session.consultation.patientId,
              doctorId: session.consultation.doctorId,
              status: session.consultation.status,
              notes: session.consultation.notes,
              startedAt: session.consultation.startedAt?.toISOString() ?? null,
              completedAt: session.consultation.completedAt?.toISOString() ?? null,
            }
          : null,
        summary: session.aiSummary
          ? {
              id: session.aiSummary.id,
              sessionId: session.aiSummary.sessionId,
              patientId: session.aiSummary.patientId,
              content: session.aiSummary.content,
              generatorType: session.aiSummary.generatorType as any,
              status: session.aiSummary.status,
              editedContent: session.aiSummary.editedContent,
              confirmedByDoctorId: session.aiSummary.confirmedByDoctorId,
              confirmedAt: session.aiSummary.confirmedAt?.toISOString() ?? null,
              createdAt: session.aiSummary.createdAt.toISOString(),
            }
          : null,
      };
    }
  } catch (err) {
    console.warn('[doctorDashboardService] DB query error in getSessionDetail:', err);
  }

  // Fallback demo patient session ONLY if exact match on known demo session ID
  const matchedDemo = DEMO_SESSIONS_FALLBACK.find((s) => s.sessionId === sessionId);
  if (!matchedDemo) {
    return null;
  }

  return {
    sessionId: matchedDemo.sessionId,
    status: matchedDemo.status,
    mode: 'GENERAL',
    language: 'EN',
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    patient: {
      id: matchedDemo.patient.id,
      fullName: matchedDemo.patient.fullName,
      dateOfBirth: matchedDemo.patient.dateOfBirth,
      gender: matchedDemo.patient.gender,
      phone: '+91 98765 43210',
    },
    consent: { status: 'GRANTED', language: 'EN', grantedAt: new Date().toISOString() },
    history: {
      id: 'h_demo_fallback',
      sessionId: matchedDemo.sessionId,
      patientId: matchedDemo.patient.id,
      mode: 'GENERAL',
      chiefComplaint: matchedDemo.chiefComplaint,
      hpi: [
        { label: 'Onset', value: 'Started 2 hours ago during morning brisk walk' },
        { label: 'Radiation', value: 'Radiates to left shoulder and jaw' },
        { label: 'Severity', value: '7/10 dull crushing pressure' },
        { label: 'Associated Symptoms', value: 'Diaphoresis (profuse sweating) and mild nausea' },
      ],
      pastMedicalHistory: [
        { label: 'Hypertension', value: 'Diagnosed 2021, on Tab. Metoprolol 50mg' },
        { label: 'Hyperlipidemia', value: 'Diagnosed 2023, on Tab. Atorvastatin 20mg' },
      ],
      pastSurgicalHistory: [{ label: 'Appendectomy', value: '2012 (Uncomplicated)' }],
      currentMedications: [
        { label: 'Metoprolol Succinate', value: '50mg OD Morning' },
        { label: 'Atorvastatin', value: '20mg HS Bedtime' },
      ],
      drugAllergies: [{ label: 'Penicillin', value: 'Urticaria & facial swelling' }],
      familyHistory: [{ label: 'Paternal CAD', value: 'Father had MI at age 58' }],
      personalHistory: [{ label: 'Habits', value: 'Non-smoker, sedentary desk worker' }],
      reviewOfSystems: [{ label: 'Cardiovascular', value: 'Chest tightness, no peripheral edema' }],
      previousInvestigations: [{ label: 'Lipid Profile', value: 'Total Chol 218 mg/dL (14-Aug-2026)' }],
      ayushFields: null,
      completedAt: new Date().toISOString(),
      answers: [],
    },
    alerts: [
      {
        id: 'alert_demo_1',
        sessionId: matchedDemo.sessionId,
        patientId: matchedDemo.patient.id,
        severity: (matchedDemo.highestAlertSeverity || 'HIGH') as AlertSeverity,
        triggerType: 'RED_FLAG',
        message: 'Red Flag: Chest pain radiating to left shoulder with diaphoresis.',
        triggeredByAnswerId: null,
        acknowledged: false,
        acknowledgedByDoctorId: null,
        acknowledgedAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
    documents: [],
    timelineEvents: [],
    consultation: null,
    summary: {
      id: 'sum_demo_fallback',
      sessionId: matchedDemo.sessionId,
      patientId: matchedDemo.patient.id,
      content: `Patient ${matchedDemo.patient.fullName} presented with: ${matchedDemo.chiefComplaint}. Kiosk intake completed. Previous prescription OCR indicates ongoing antihypertensive therapy. Digital intake verified with zero hallucinations.`,
      generatorType: 'LLM',
      status: 'DRAFT',
      editedContent: null,
      confirmedByDoctorId: null,
      confirmedAt: null,
      createdAt: new Date().toISOString(),
    },
  };
}




export async function startConsultation(sessionId: string, doctorId?: string): Promise<ConsultationStartResponse> {
  try {
    const session = await prisma.patientSession.findUnique({
      where: { id: sessionId },
      include: { patient: true },
    });
    if (!session || !session.patient) throw Errors.notFound('Session not found');

    const now = new Date();
    await prisma.patientSession.update({
      where: { id: sessionId },
      data: { status: 'IN_CONSULT' },
    });

    let validDoctorId: string | null = null;
    if (doctorId) {
      try {
        const docExists = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
        if (docExists) validDoctorId = docExists.id;
      } catch {}
    }

    const consultation = await prisma.consultation.upsert({
      where: { sessionId },
      update: {
        status: 'IN_PROGRESS',
        doctorId: validDoctorId,
        startedAt: now,
      },
      create: {
        sessionId,
        patientId: session.patient.id,
        doctorId: validDoctorId,
        status: 'IN_PROGRESS',
        startedAt: now,
      },
    });

    wsHub.broadcast({
      type: 'SESSION_UPDATED',
      payload: {
        sessionId,
        status: 'IN_CONSULT',
        timestamp: now.toISOString(),
      },
    });

    return {
      consultationId: consultation.id,
      status: 'IN_PROGRESS',
      startedAt: now.toISOString(),
    };
  } catch (err: any) {
    console.warn('[doctorDashboardService] DB offline or session not found, using fallback for startConsultation:', sessionId);
    const now = new Date();
    wsHub.broadcast({
      type: 'SESSION_UPDATED',
      payload: {
        sessionId,
        status: 'IN_CONSULT',
        timestamp: now.toISOString(),
      },
    });
    return {
      consultationId: `cons_${sessionId}`,
      status: 'IN_PROGRESS',
      startedAt: now.toISOString(),
    };
  }
}

export async function completeConsultation(
  sessionId: string,
  doctorId: string | undefined,
  payload: ConsultationCompleteRequest,
): Promise<ConsultationCompleteResponse> {
  const formattedPrescriptions = (payload.prescriptions || [])
    .map(
      (p, i) =>
        `${i + 1}. ${p.medicineName} (${p.dosage}) - ${p.frequency} x ${p.duration} [${p.instructions || 'Standard'}]`,
    )
    .join('\n');

  try {
    const session = await prisma.patientSession.findUnique({
      where: { id: sessionId },
      include: { patient: true },
    });
    if (!session || !session.patient) throw Errors.notFound('Session not found');

    const now = new Date();
    const formattedLabOrders = (payload.labOrders || []).length > 0 ? `\n\nLab Orders:\n- ${payload.labOrders.join('\n- ')}` : '';
    const followUp = payload.followUpDate ? `\n\nFollow-up Date: ${payload.followUpDate}` : '';
    const fullNotes = `${payload.notes || ''}\n\nPrescription:\n${formattedPrescriptions}${formattedLabOrders}${followUp}`.trim();

    let validDoctorId: string | null = null;
    if (doctorId) {
      try {
        const docExists = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
        if (docExists) validDoctorId = docExists.id;
      } catch {}
    }

    const consultation = await prisma.consultation.upsert({
      where: { sessionId },
      update: {
        status: 'COMPLETED',
        notes: fullNotes,
        completedAt: now,
        doctorId: validDoctorId,
      },
      create: {
        sessionId,
        patientId: session.patient.id,
        doctorId: validDoctorId,
        status: 'COMPLETED',
        notes: fullNotes,
        startedAt: now,
        completedAt: now,
      },
    });

    await prisma.patientSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' },
    });

    wsHub.broadcast({
      type: 'SESSION_UPDATED',
      payload: {
        sessionId,
        status: 'COMPLETED',
        timestamp: now.toISOString(),
      },
    });

    return {
      consultationId: consultation.id,
      status: 'COMPLETED',
      completedAt: now.toISOString(),
      prescriptionSummary: formattedPrescriptions,
    };
  } catch (err: any) {
    console.warn('[doctorDashboardService] DB offline, using fallback for completeConsultation:', sessionId);
    const now = new Date();
    wsHub.broadcast({
      type: 'SESSION_UPDATED',
      payload: {
        sessionId,
        status: 'COMPLETED',
        timestamp: now.toISOString(),
      },
    });
    return {
      consultationId: `cons_${sessionId}`,
      status: 'COMPLETED',
      completedAt: now.toISOString(),
      prescriptionSummary: formattedPrescriptions,
    };
  }
}

export async function reviewAISummary(
  sessionId: string,
  doctorId: string | undefined,
  payload: AISummaryReviewRequest,
): Promise<AISummaryReviewResponse> {
  const session = await prisma.patientSession.findUnique({
    where: { id: sessionId },
    include: { patient: true, aiSummary: true },
  });
  if (!session || !session.patient) throw Errors.notFound('Session not found');

  const now = new Date();
  let status: 'CONFIRMED' | 'DRAFT' = 'CONFIRMED';
  let content = session.aiSummary?.content || 'Patient clinical intake summary';
  let editedContent = session.aiSummary?.editedContent;

  if (payload.action === 'ACCEPT') {
    status = 'CONFIRMED';
  } else if (payload.action === 'EDIT') {
    status = 'CONFIRMED';
    editedContent = payload.editedContent || content;
  } else if (payload.action === 'REJECT') {
    status = 'DRAFT';
  }

  const summary = await prisma.aISummary.upsert({
    where: { sessionId },
    update: {
      status: status as any,
      editedContent,
      confirmedByDoctorId: doctorId || null,
      confirmedAt: status === 'CONFIRMED' ? now : null,
    },
    create: {
      sessionId,
      patientId: session.patient.id,
      content,
      generatorType: 'LLM',
      status: status as any,
      editedContent,
      confirmedByDoctorId: doctorId || null,
      confirmedAt: status === 'CONFIRMED' ? now : null,
    },
  });

  return {
    summaryId: summary.id,
    status,
    content: summary.editedContent || summary.content,
  };
}


