import type { PatientSession } from '@medikiosk/shared-types';

type Status = PatientSession['status'];

export const STATUS_DISPLAY: Record<Status, { dot: string; label: string }> = {
  CREATED: { dot: '🟡', label: 'Identifying' },
  IDENTIFIED: { dot: '🟡', label: 'Identifying' },
  CONSENTED: { dot: '🔵', label: 'Collecting history' },
  IN_HISTORY: { dot: '🔵', label: 'Collecting history' },
  DOCUMENTS: { dot: '🟠', label: 'Review required' },
  SUMMARY_READY: { dot: '🟠', label: 'Review required' },
  ROUTED: { dot: '🟢', label: 'Ready for doctor' },
  IN_CONSULT: { dot: '🔵', label: 'In consultation' },
  COMPLETED: { dot: '⚪', label: 'Completed' },
  ABANDONED: { dot: '⚫', label: 'Abandoned' },
};

export function isActiveStatus(status: Status): boolean {
  return status !== 'COMPLETED' && status !== 'ABANDONED';
}
