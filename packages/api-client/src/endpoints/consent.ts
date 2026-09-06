import type { ConsentRequest, ConsentResponse } from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function submitConsent(body: ConsentRequest): Promise<ConsentResponse> {
  return apiFetch<ConsentResponse>('/consent', { method: 'POST', body });
}
