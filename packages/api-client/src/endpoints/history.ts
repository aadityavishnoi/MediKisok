import type {
  HistoryAnswerRequest,
  HistoryAnswerResponse,
  HistoryStartRequest,
  HistoryStartResponse,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function startHistory(body: HistoryStartRequest): Promise<HistoryStartResponse> {
  return apiFetch<HistoryStartResponse>('/history/start', { method: 'POST', body });
}

export function answerHistory(body: HistoryAnswerRequest): Promise<HistoryAnswerResponse> {
  return apiFetch<HistoryAnswerResponse>('/history/answer', { method: 'POST', body });
}
