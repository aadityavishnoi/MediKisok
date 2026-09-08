import type {
  QueueItemRow,
  QueueTicketRequest,
  QueueTicketResponse,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function issueQueueTicket(payload: QueueTicketRequest): Promise<QueueTicketResponse> {
  return apiFetch<QueueTicketResponse>('/queue/ticket', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listQueues(query?: {
  hospitalId?: string;
  departmentId?: string;
  doctorId?: string;
  status?: string;
}): Promise<{ queue: QueueItemRow[] }> {
  const params = new URLSearchParams();
  if (query?.hospitalId) params.set('hospitalId', query.hospitalId);
  if (query?.departmentId) params.set('departmentId', query.departmentId);
  if (query?.doctorId) params.set('doctorId', query.doctorId);
  if (query?.status) params.set('status', query.status);
  const qs = params.toString();
  return apiFetch<{ queue: QueueItemRow[] }>(`/queues${qs ? `?${qs}` : ''}`);
}

export function callNextQueuePatient(queueId: string, doctorId?: string): Promise<{ success: boolean; item: QueueItemRow }> {
  return apiFetch<{ success: boolean; item: QueueItemRow }>(`/queues/${queueId}/call-next`, {
    method: 'POST',
    body: JSON.stringify({ doctorId }),
  });
}

export function markQueueInConsultation(queueId: string): Promise<{ success: boolean; item: QueueItemRow }> {
  return apiFetch<{ success: boolean; item: QueueItemRow }>(`/queues/${queueId}/in-consultation`, {
    method: 'POST',
  });
}

export function transferQueuePatient(queueId: string, payload: { doctorId?: string; departmentId?: string }): Promise<{ success: boolean; item: QueueItemRow }> {
  return apiFetch<{ success: boolean; item: QueueItemRow }>(`/queues/${queueId}/transfer`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function reprioritizeQueuePatient(queueId: string, priority: 'NORMAL' | 'URGENT' | 'EMERGENCY'): Promise<{ success: boolean; item: QueueItemRow }> {
  return apiFetch<{ success: boolean; item: QueueItemRow }>(`/queues/${queueId}/reprioritize`, {
    method: 'POST',
    body: JSON.stringify({ priority }),
  });
}

export function markQueueNoShow(queueId: string): Promise<{ success: boolean; item: QueueItemRow }> {
  return apiFetch<{ success: boolean; item: QueueItemRow }>(`/queues/${queueId}/no-show`, {
    method: 'POST',
  });
}

export function cancelQueueTicket(queueId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/queues/${queueId}/cancel`, {
    method: 'POST',
  });
}
