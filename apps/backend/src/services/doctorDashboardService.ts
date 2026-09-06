import type { AlertSeverity, DoctorDashboardResponse } from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';

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
