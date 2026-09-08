import type {
  AiModelCreateRequest,
  AuditLogRow,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function getAdminMetrics(): Promise<any> {
  return apiFetch<any>('/admin/metrics');
}

export function getAdminDevices(): Promise<{ total: number; devices: any[] }> {
  return apiFetch<{ total: number; devices: any[] }>('/admin/devices');
}

export function getNationalAnalytics(): Promise<any> {
  return apiFetch<any>('/admin/analytics/national');
}

export function getStateAnalytics(): Promise<any> {
  return apiFetch<any>('/admin/analytics/by-state');
}

export function getAiModels(): Promise<{ total: number; models: any[] }> {
  return apiFetch<{ total: number; models: any[] }>('/admin/ai-models');
}

export function registerAiModel(payload: AiModelCreateRequest): Promise<{ model: any }> {
  return apiFetch<{ model: any }>('/admin/ai-models', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deployAiModel(id: string, environment?: string): Promise<{ deployment: any }> {
  return apiFetch<{ deployment: any }>(`/admin/ai-models/${id}/deploy`, {
    method: 'POST',
    body: JSON.stringify({ environment }),
  });
}

export function rollbackAiModel(id: string, reason: string): Promise<{ result: any }> {
  return apiFetch<{ result: any }>(`/admin/ai-models/${id}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function getAuditLogs(query?: {
  facilityId?: string;
  action?: string;
  entityType?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; logs: AuditLogRow[] }> {
  const params = new URLSearchParams();
  if (query?.facilityId) params.set('facilityId', query.facilityId);
  if (query?.action) params.set('action', query.action);
  if (query?.entityType) params.set('entityType', query.entityType);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiFetch<{ total: number; page: number; limit: number; logs: AuditLogRow[] }>(`/audit-logs${qs ? `?${qs}` : ''}`);
}
