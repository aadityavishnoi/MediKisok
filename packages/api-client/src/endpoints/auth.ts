import type {
  AuthLoginRequest,
  AuthLoginResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RegisterKioskPatientRequest,
  RegisterKioskPatientResponse,
} from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function login(body: AuthLoginRequest): Promise<AuthLoginResponse> {
  return apiFetch<AuthLoginResponse>('/auth/login', { method: 'POST', body });
}

export function sendOtp(body: SendOtpRequest): Promise<SendOtpResponse> {
  return apiFetch<SendOtpResponse>('/auth/otp/send', { method: 'POST', body });
}

export function verifyOtp(body: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>('/auth/otp/verify', { method: 'POST', body });
}

export function registerKioskPatient(body: RegisterKioskPatientRequest): Promise<RegisterKioskPatientResponse> {
  return apiFetch<RegisterKioskPatientResponse>('/patients/register-kiosk', { method: 'POST', body });
}
