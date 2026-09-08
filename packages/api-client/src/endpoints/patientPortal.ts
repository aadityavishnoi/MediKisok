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

export function getAvailableAppointmentSlots(): Promise<AvailableSlotsResponse> {
  return apiFetch<AvailableSlotsResponse>('/patient/available-slots');
}

export function getPatientPrescriptions(): Promise<PrescriptionEntity[]> {
  return apiFetch<PrescriptionEntity[]>('/patient/prescriptions');
}

export function getPatientLabReports(): Promise<LabReportEntity[]> {
  return apiFetch<LabReportEntity[]>('/patient/lab-reports');
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
