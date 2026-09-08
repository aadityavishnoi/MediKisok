import type {
  DepartmentCreateRequest,
  DoctorCreateRequest,
  HospitalCreateRequest,
  HospitalListResponse,
  HospitalStatusUpdateRequest,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function listHospitals(query?: {
  status?: string;
  state?: string;
  district?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<HospitalListResponse> {
  const params = new URLSearchParams();
  if (query?.status) params.set('status', query.status);
  if (query?.state) params.set('state', query.state);
  if (query?.district) params.set('district', query.district);
  if (query?.search) params.set('search', query.search);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiFetch<HospitalListResponse>(`/hospitals${qs ? `?${qs}` : ''}`);
}

export function getHospital(id: string): Promise<any> {
  return apiFetch<any>(`/hospitals/${id}`);
}

export function createHospital(payload: HospitalCreateRequest): Promise<any> {
  return apiFetch<any>('/hospitals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateHospital(id: string, payload: Partial<HospitalCreateRequest>): Promise<any> {
  return apiFetch<any>(`/hospitals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function approveHospital(id: string): Promise<any> {
  return apiFetch<any>(`/hospitals/${id}/approve`, { method: 'POST' });
}

export function rejectHospital(id: string, reason: string): Promise<any> {
  return apiFetch<any>(`/hospitals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function suspendHospital(id: string, reason: string): Promise<any> {
  return apiFetch<any>(`/hospitals/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function reactivateHospital(id: string): Promise<any> {
  return apiFetch<any>(`/hospitals/${id}/reactivate`, { method: 'POST' });
}

// Departments
export function listDepartments(hospitalId: string): Promise<{ departments: any[] }> {
  return apiFetch<{ departments: any[] }>(`/hospitals/${hospitalId}/departments`);
}

export function createDepartment(hospitalId: string, payload: DepartmentCreateRequest): Promise<any> {
  return apiFetch<any>(`/hospitals/${hospitalId}/departments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDepartment(hospitalId: string, deptId: string, payload: Partial<DepartmentCreateRequest>): Promise<any> {
  return apiFetch<any>(`/hospitals/${hospitalId}/departments/${deptId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function toggleDepartment(hospitalId: string, deptId: string): Promise<any> {
  return apiFetch<any>(`/hospitals/${hospitalId}/departments/${deptId}/toggle`, {
    method: 'PATCH',
  });
}

// Doctors
export function listHospitalDoctors(hospitalId?: string): Promise<{ doctors: any[] }> {
  return apiFetch<{ doctors: any[] }>(`/hospitals/doctors${hospitalId ? `?hospitalId=${hospitalId}` : ''}`);
}

export function createDoctor(hospitalId: string, payload: DoctorCreateRequest): Promise<any> {
  return apiFetch<any>(`/hospitals/${hospitalId}/doctors`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDoctorStatus(doctorId: string, status: string): Promise<any> {
  return apiFetch<any>(`/hospitals/doctors/${doctorId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
