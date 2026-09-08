import type {
  PatientAuthResponse,
  PatientRegisterDto,
  PatientLoginDto,
  PatientPortalProfile,
  UpdatePatientProfileDto,
  PatientDashboardDto,
  AppointmentEntity,
  BookAppointmentDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
  AvailableSlotsResponse,
  PrescriptionEntity,
  LabReportEntity,
  PatientMedicalRecordsResponse,
  BillingInvoiceEntity,
  ProcessPaymentDto,
  PatientNotificationEntity,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function patientRegister(dto: PatientRegisterDto): Promise<PatientAuthResponse> {
  return apiFetch<PatientAuthResponse>('/patient/auth/register', {
    method: 'POST',
    body: dto,
  });
}

export function patientLogin(dto: PatientLoginDto): Promise<PatientAuthResponse> {
  return apiFetch<PatientAuthResponse>('/patient/auth/login', {
    method: 'POST',
    body: dto,
  });
}

export function getPatientProfile(): Promise<PatientPortalProfile> {
  return apiFetch<PatientPortalProfile>('/patient/profile');
}

export function updatePatientProfile(dto: UpdatePatientProfileDto): Promise<PatientPortalProfile> {
  return apiFetch<PatientPortalProfile>('/patient/profile', {
    method: 'PUT',
    body: dto,
  });
}

export function getPatientDashboard(): Promise<PatientDashboardDto> {
  return apiFetch<PatientDashboardDto>('/patient/dashboard');
}

export function getPatientAppointments(status?: string): Promise<AppointmentEntity[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<AppointmentEntity[]>(`/patient/appointments${query}`);
}

export function bookPatientAppointment(dto: BookAppointmentDto): Promise<AppointmentEntity> {
  return apiFetch<AppointmentEntity>('/patient/appointments', {
    method: 'POST',
    body: dto,
  });
}

export function reschedulePatientAppointment(
  id: string,
  dto: RescheduleAppointmentDto,
): Promise<AppointmentEntity> {
  return apiFetch<AppointmentEntity>(`/patient/appointments/${id}/reschedule`, {
    method: 'PUT',
    body: dto,
  });
}

export function cancelPatientAppointment(
  id: string,
  dto: CancelAppointmentDto,
): Promise<AppointmentEntity> {
  return apiFetch<AppointmentEntity>(`/patient/appointments/${id}/cancel`, {
    method: 'PUT',
    body: dto,
  });
}

export function getAvailableAppointmentSlots(doctorId?: string, date?: string): Promise<AvailableSlotsResponse> {
  const params = new URLSearchParams();
  if (doctorId) params.set('doctorId', doctorId);
  if (date) params.set('date', date);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<AvailableSlotsResponse>(`/patient/available-slots${query}`);
}

export function getPatientPrescriptions(status?: string): Promise<PrescriptionEntity[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<PrescriptionEntity[]>(`/patient/prescriptions${query}`);
}

export function getPatientPrescriptionDetail(id: string): Promise<PrescriptionEntity> {
  return apiFetch<PrescriptionEntity>(`/patient/prescriptions/${id}`);
}

export interface ReportQueryOptions {
  search?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sort?: 'newest' | 'oldest';
}

export function getPatientLabReports(options?: ReportQueryOptions): Promise<LabReportEntity[]> {
  const params = new URLSearchParams();
  if (options?.search) params.set('search', options.search);
  if (options?.type) params.set('type', options.type);
  if (options?.category) params.set('category', options.category);
  if (options?.startDate) params.set('startDate', options.startDate);
  if (options?.endDate) params.set('endDate', options.endDate);
  if (options?.sort) params.set('sort', options.sort);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<LabReportEntity[]>(`/patient/reports${query}`);
}

export const getPatientReports = getPatientLabReports;

export function getPatientReportDetail(id: string): Promise<LabReportEntity> {
  return apiFetch<LabReportEntity>(`/patient/reports/${id}`);
}

export function getPatientMedicalRecords(): Promise<PatientMedicalRecordsResponse> {
  return apiFetch<PatientMedicalRecordsResponse>('/patient/medical-records');
}

export function getPatientBillingInvoices(status?: string): Promise<BillingInvoiceEntity[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<BillingInvoiceEntity[]>(`/patient/billing${query}`);
}

export function payPatientInvoice(
  id: string,
  dto: ProcessPaymentDto,
): Promise<BillingInvoiceEntity> {
  return apiFetch<BillingInvoiceEntity>(`/patient/billing/${id}/pay`, {
    method: 'POST',
    body: dto,
  });
}

export function getPatientNotifications(): Promise<PatientNotificationEntity[]> {
  return apiFetch<PatientNotificationEntity[]>('/patient/notifications');
}

export function markPatientNotificationRead(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/patient/notifications/${id}/read`, {
    method: 'PUT',
  });
}

export function markAllPatientNotificationsRead(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/patient/notifications/read-all', {
    method: 'PUT',
  });
}
