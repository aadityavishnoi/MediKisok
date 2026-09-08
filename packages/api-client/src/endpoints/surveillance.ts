import type {
  SurveillanceSignalCreateRequest,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function getOutbreakOverview(state?: string): Promise<{ totalReports: number; signals: any[]; summary: any[] }> {
  return apiFetch<{ totalReports: number; signals: any[]; summary: any[] }>(`/surveillance/outbreaks${state ? `?state=${state}` : ''}`);
}

export function listSurveillanceSignals(query?: {
  state?: string;
  district?: string;
  severity?: string;
}): Promise<{ signals: any[] }> {
  const params = new URLSearchParams();
  if (query?.state) params.set('state', query.state);
  if (query?.district) params.set('district', query.district);
  if (query?.severity) params.set('severity', query.severity);
  const qs = params.toString();
  return apiFetch<{ signals: any[] }>(`/surveillance/signals${qs ? `?${qs}` : ''}`);
}

export function recordSurveillanceSignal(payload: SurveillanceSignalCreateRequest): Promise<{ success: boolean; signal: any }> {
  return apiFetch<{ success: boolean; signal: any }>('/surveillance/signal', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function acknowledgeSurveillanceSignal(id: string): Promise<{ success: boolean; signal: any }> {
  return apiFetch<{ success: boolean; signal: any }>(`/surveillance/signals/${id}/acknowledge`, {
    method: 'POST',
  });
}

export function escalateSurveillanceSignal(id: string): Promise<{ success: boolean; signal: any }> {
  return apiFetch<{ success: boolean; signal: any }>(`/surveillance/signals/${id}/escalate`, {
    method: 'POST',
  });
}

export function resolveSurveillanceSignal(id: string, note?: string): Promise<{ success: boolean; signal: any }> {
  return apiFetch<{ success: boolean; signal: any }>(`/surveillance/signals/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}
