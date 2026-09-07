import type { RfidScanResponse, RfidSimulateRequest } from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export interface RfidPatientLookupResponse {
  success: boolean;
  message?: string;
  card?: {
    uid: string;
    active: boolean;
    issuedAt: string;
  };
  patient?: {
    id: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
    phone: string | null;
    abhaId: string | null;
    registrationSource?: string;
    createdAt?: string;
  };
  encounter?: {
    id: string;
    status: string;
    mode: string;
    language: string;
    createdAt: string;
    consultation?: any;
  } | null;
}

export interface RfidReaderStatusResponse {
  connected: boolean;
  state: string;
  port: string;
  baudRate: number;
  enabled: boolean;
}

export function simulateRfidScan(body: RfidSimulateRequest = {}): Promise<RfidScanResponse> {
  return apiFetch<RfidScanResponse>('/rfid/simulate', { method: 'POST', body });
}

export function lookupRfidPatient(uid: string): Promise<RfidPatientLookupResponse> {
  return apiFetch<RfidPatientLookupResponse>(`/rfid/patient/${encodeURIComponent(uid)}`, {
    method: 'GET',
  });
}

export function getRfidReaderStatus(): Promise<RfidReaderStatusResponse> {
  return apiFetch<RfidReaderStatusResponse>('/rfid/status', {
    method: 'GET',
  });
}

