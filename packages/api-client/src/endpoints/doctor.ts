import type {
  AlertAcknowledgeResponse,
  AISummaryReviewRequest,
  AISummaryReviewResponse,
  ConsultationCompleteRequest,
  ConsultationCompleteResponse,
  ConsultationStartResponse,
  CopilotChatResponse,
  DoctorDashboardResponse,
  SessionDetailResponse,
} from '@medikiosk/shared-types';
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

export function startConsultation(sessionId: string): Promise<ConsultationStartResponse> {
  return apiFetch<ConsultationStartResponse>(`/doctor/sessions/${sessionId}/consultation/start`, { method: 'POST' });
}

export function completeConsultation(
  sessionId: string,
  payload: ConsultationCompleteRequest,
): Promise<ConsultationCompleteResponse> {
  return apiFetch<ConsultationCompleteResponse>(`/doctor/sessions/${sessionId}/consultation/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function reviewAISummary(
  sessionId: string,
  payload: AISummaryReviewRequest,
): Promise<AISummaryReviewResponse> {
  return apiFetch<AISummaryReviewResponse>(`/doctor/sessions/${sessionId}/summary`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function askCopilotChat(
  sessionId: string,
  query: string,
): Promise<CopilotChatResponse> {
  return apiFetch<CopilotChatResponse>(`/doctor/sessions/${sessionId}/copilot-chat`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

