import type {
  RfidCardCreateRequest,
  RfidCardReplaceRequest,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function listRfidCards(query?: {
  status?: string;
  hospitalId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; cards: any[] }> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.hospitalId) params.set('hospitalId', query.hospitalId);
  if (query?.search) params.set('search', query.search);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiFetch<{ total: number; page: number; limit: number; cards: any[] }>(`/rfid/cards${qs ? `?${qs}` : ''}`);
}

export function getRfidCard(uid: string): Promise<{ card: any; auditHistory: any[] }> {
  return apiFetch<{ card: any; auditHistory: any[] }>(`/rfid/cards/${uid}`);
}

export function registerRfidCard(payload: RfidCardCreateRequest): Promise<{ card: any }> {
  return apiFetch<{ card: any }>('/rfid/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function assignRfidCard(uid: string, patientId: string): Promise<{ card: any }> {
  return apiFetch<{ card: any }>(`/rfid/cards/${uid}/assign`, {
    method: 'POST',
    body: JSON.stringify({ patientId }),
  });
}

export function activateRfidCard(uid: string): Promise<{ card: any }> {
  return apiFetch<{ card: any }>(`/rfid/cards/${uid}/activate`, {
    method: 'POST',
  });
}

export function suspendRfidCard(uid: string, reason?: string): Promise<{ card: any }> {
  return apiFetch<{ card: any }>(`/rfid/cards/${uid}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function reactivateRfidCard(uid: string): Promise<{ card: any }> {
  return apiFetch<{ card: any }>(`/rfid/cards/${uid}/reactivate`, {
    method: 'POST',
  });
}

export function markRfidCardLost(uid: string, reason?: string): Promise<{ card: any }> {
  return apiFetch<{ card: any }>(`/rfid/cards/${uid}/mark-lost`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function replaceRfidCard(uid: string, payload: RfidCardReplaceRequest): Promise<{ oldCard: any; newCard: any }> {
  return apiFetch<{ oldCard: any; newCard: any }>(`/rfid/cards/${uid}/replace`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function retireRfidCard(uid: string, reason?: string): Promise<{ card: any }> {
  return apiFetch<{ card: any }>(`/rfid/cards/${uid}/retire`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function simulateRfidTap(uid?: string, deviceCode?: string): Promise<any> {
  return apiFetch<any>('/rfid/simulate', {
    method: 'POST',
    body: JSON.stringify({ uid, deviceCode }),
  });
}
