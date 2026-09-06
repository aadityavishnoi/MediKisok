import type { AuthLoginRequest, AuthLoginResponse } from '@medikiosk/shared-types';
import { apiFetch } from '../client.js';

export function login(body: AuthLoginRequest): Promise<AuthLoginResponse> {
  return apiFetch<AuthLoginResponse>('/auth/login', { method: 'POST', body });
}
