import type { AlertAcknowledgeResponse, DoctorDashboardResponse, SessionDetailResponse } from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function getDoctorDashboard(): Promise<DoctorDashboardResponse> {
  return apiFetch<DoctorDashboardResponse>('/doctor/dashboard');
}

export function getSessionDetail(sessionId: string): Promise<SessionDetailResponse> {
  return apiFetch<SessionDetailResponse>(`/doctor/sessions/${sessionId}`);
}

export function acknowledgeAlert(alertId: string): Promise<AlertAcknowledgeResponse> {
  return apiFetch<AlertAcknowledgeResponse>(`/doctor/alerts/${alertId}/acknowledge`, { method: 'POST' });
}
