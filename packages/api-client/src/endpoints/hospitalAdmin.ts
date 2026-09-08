import type {
  HospitalOverviewResponse,
  HospitalDepartmentItem,
  HospitalDoctorItem,
  HospitalKioskItem,
  KioskModeUpdateResponse,
  HospitalRfidInventoryResponse,
  HospitalHisIntegrationResponse,
  HospitalIncidentItem,
  HospitalIncidentDispatchResponse,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function getHospitalOverview(): Promise<HospitalOverviewResponse> {
  return apiFetch<HospitalOverviewResponse>('/hospital/overview');
}

export function getHospitalDepartments(): Promise<HospitalDepartmentItem[]> {
  return apiFetch<HospitalDepartmentItem[]>('/hospital/departments');
}

export function getHospitalDoctors(): Promise<HospitalDoctorItem[]> {
  return apiFetch<HospitalDoctorItem[]>('/hospital/doctors');
}

export function getHospitalKiosks(): Promise<HospitalKioskItem[]> {
  return apiFetch<HospitalKioskItem[]>('/hospital/kiosks');
}

export function updateHospitalKioskMode(code: string, mode: string): Promise<KioskModeUpdateResponse> {
  return apiFetch<KioskModeUpdateResponse>(`/hospital/kiosks/${code}/mode`, {
    method: 'PATCH',
    body: { mode },
  });
}

export function getHospitalRfidInventory(): Promise<HospitalRfidInventoryResponse> {
  return apiFetch<HospitalRfidInventoryResponse>('/hospital/rfid-inventory');
}

export function getHospitalHisIntegration(): Promise<HospitalHisIntegrationResponse> {
  return apiFetch<HospitalHisIntegrationResponse>('/hospital/his-integration');
}

export function getHospitalIncidents(): Promise<HospitalIncidentItem[]> {
  return apiFetch<HospitalIncidentItem[]>('/hospital/incidents');
}

export function dispatchHospitalIncidentStaff(id: string, staffName?: string): Promise<HospitalIncidentDispatchResponse> {
  return apiFetch<HospitalIncidentDispatchResponse>(`/hospital/incidents/${id}/dispatch`, {
    method: 'POST',
    body: { staffName },
  });
}
