import type { DoctorDashboardResponse } from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function getDoctorDashboard(): Promise<DoctorDashboardResponse> {
  return apiFetch<DoctorDashboardResponse>('/doctor/dashboard');
}
