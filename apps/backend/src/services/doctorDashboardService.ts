import type { AlertSeverity, DoctorDashboardResponse, SessionDetailResponse } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';

const SEVERITY_RANK: Record<AlertSeverity, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

function highestSeverity(alerts: { severity: AlertSeverity }[]): AlertSeverity | null {
  if (alerts.length === 0) return null;
  return alerts.reduce<AlertSeverity>(
    (max, a) => (SEVERITY_RANK[a.severity] > SEVERITY_RANK[max] ? a.severity : max),
    alerts[0].severity,
  );
}

export async function getDoctorDashboard(): Promise<DoctorDashboardResponse> {
  const sessions = await prisma.patientSession.findMany({
    where: { patientId: { not: null } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      patient: true,
      clinicalHistory: { select: { chiefComplaint: true } },
      alerts: { select: { severity: true } },
    },
  });

  return {
    sessions: sessions
      .filter((s) => s.patient !== null)
      .map((s) => ({
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
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
  const session = await prisma.patientSession.findUnique({
    where: { id: sessionId },
    include: {
      patient: true,
      consent: true,
      clinicalHistory: { include: { answers: { orderBy: { answeredAt: 'asc' } } } },
      alerts: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!session || !session.patient) throw Errors.notFound('Session not found');

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
      ? { status: session.consent.status, language: session.consent.language, grantedAt: session.consent.grantedAt?.toISOString() ?? null }
      : null,
    history: session.clinicalHistory
      ? {
          id: session.clinicalHistory.id,
          sessionId: session.clinicalHistory.sessionId,
          patientId: session.clinicalHistory.patientId,
          mode: session.clinicalHistory.mode,
          chiefComplaint: session.clinicalHistory.chiefComplaint,
          hpi: (session.clinicalHistory.hpi as any) ?? [],
          pastMedicalHistory: (session.clinicalHistory.pastMedicalHistory as any) ?? [],
          pastSurgicalHistory: (session.clinicalHistory.pastSurgicalHistory as any) ?? [],
          currentMedications: (session.clinicalHistory.currentMedications as any) ?? [],
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
      : null,
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
    documents: (
      await prisma.medicalDocument.findMany({
        where: {
          OR: [{ sessionId: session.id }, { patientId: session.patient.id }],
        },
        include: { extractedData: true },
        orderBy: { createdAt: 'desc' },
      })
    ).map((d) => ({
      id: d.id,
      sessionId: d.sessionId,
      patientId: d.patientId,
      type: d.type as any,
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
        status: e.status as any,
        verifiedBy: e.verifiedBy,
        verifiedAt: e.verifiedAt?.toISOString() ?? null,
      })),
    })),
  };
}
