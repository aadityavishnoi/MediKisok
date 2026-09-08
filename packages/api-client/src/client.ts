import type { ApiErrorBody } from '@medikiosk/shared-types';

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface ApiClientConfig {
  baseUrl: string;
  wsUrl: string;
  getToken?: () => string | null;
}

function getDefaultBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
}

function getDefaultWsUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }
  return 'ws://localhost:4000/ws';
}

let config: ApiClientConfig = {
  baseUrl: getDefaultBaseUrl(),
  wsUrl: getDefaultWsUrl(),
};

/** Call once at app startup (e.g. from main.tsx) before any request is made. */
export function configureApiClient(next: Partial<ApiClientConfig>) {
  config = { ...config, ...next };
}

export function getWsUrl(): string {
  return config.wsUrl;
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; deviceKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = config.getToken?.();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.deviceKey) headers['X-Device-Key'] = options.deviceKey;

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
      body = options.body;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
  });

  if (!res.ok) {
    let parsed: ApiErrorBody | null = null;
    try {
      parsed = (await res.json()) as ApiErrorBody;
    } catch {
      // response body wasn't JSON - fall through to generic error below
    }
    throw new ApiClientError(
      res.status,
      parsed?.error.code ?? 'UNKNOWN_ERROR',
      parsed?.error.message ?? `Request failed with status ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
