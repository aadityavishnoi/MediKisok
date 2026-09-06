import type { RfidScanResponse, RfidSimulateRequest } from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function simulateRfidScan(body: RfidSimulateRequest = {}): Promise<RfidScanResponse> {
  return apiFetch<RfidScanResponse>('/rfid/simulate', { method: 'POST', body });
}
