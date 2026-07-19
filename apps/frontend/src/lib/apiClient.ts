import { env } from '@/lib/config/env';

const JSON_CONTENT_TYPE = 'application/json';
const REFRESH_PATH = '/api/auth/refresh';

let refreshPromise: Promise<boolean> | null = null;

export interface ApiErrorBody {
  type?: string;
  message?: string;
}

/** Structured API failure — map `type` to `t('errors.*')` in UI. */
export class ApiError extends Error {
  readonly status: number;
  readonly type: string;

  constructor(status: number, message: string, type?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type ?? (status === 401 ? 'auth_required' : status === 403 ? 'forbidden' : 'request_failed');
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Resolve relative MMS paths; pass through absolute third-party URLs unchanged. */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return env.apiUrl ? `${env.apiUrl}${normalized}` : normalized;
}

function isTenantSessionRequest(path: string): boolean {
  const apiOrigin = env.apiUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  let url: URL;
  try {
    url = new URL(resolveApiUrl(path), apiOrigin);
  } catch {
    return false;
  }

  const expectedOrigin = new URL(apiOrigin, apiOrigin).origin;
  if (url.origin !== expectedOrigin || !url.pathname.startsWith('/api/')) {
    return false;
  }

  if (url.pathname.startsWith('/api/platform/')) return false;
  if (url.pathname === REFRESH_PATH || url.pathname === '/api/auth/logout') return false;

  return ![
    '/api/auth/login',
    '/api/auth/onboard',
    '/api/auth/handoff',
    '/api/auth/2fa/verify',
    '/api/auth/2fa/resend',
    '/api/auth/onboarding-status',
  ].includes(url.pathname);
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(resolveApiUrl(REFRESH_PATH), {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function isAuthenticationRequired(response: Response): Promise<boolean> {
  if (response.status !== 401) return false;
  const body = await response.clone().json().catch(() => null) as ApiErrorBody | null;
  return body?.type === 'auth_required';
}

/** Cookie-first API client (`credentials: 'include'`). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!headers.has('Content-Type') && init.body && !isFormData) {
    headers.set('Content-Type', JSON_CONTENT_TYPE);
  }

  // Intercept and sanitize outgoing column preference payloads to guarantee zero-trust schema compliance.
  if ((path.includes('column-preferences') || path.includes('column-prefs')) && init.body && typeof init.body === 'string') {
    try {
      const parsed = JSON.parse(init.body);
      const rawPreferences = Array.isArray(parsed?.preferences)
        ? parsed.preferences
        : Array.isArray(parsed?.prefs)
          ? parsed.prefs
          : null;
      if (rawPreferences) {
        const sanitizedPreferences = rawPreferences
          .filter((columnPreference: any) => {
            return (
              columnPreference &&
              typeof columnPreference === 'object' &&
              typeof columnPreference.key === 'string' &&
              columnPreference.key.trim().length > 0
            );
          })
          .map((columnPreference: any, index: number) => {
            const enabled = typeof columnPreference.enabled === 'boolean'
              ? columnPreference.enabled
              : columnPreference.enabled === 'true' || columnPreference.enabled === 1 || columnPreference.enabled === '1';
            const rawOrder = typeof columnPreference.order === 'number'
              ? columnPreference.order
              : parseFloat(String(columnPreference.order));
            const floored = Math.floor(rawOrder);
            const order = Number.isSafeInteger(floored) && floored >= 0 ? floored : index;
            return {
              key: columnPreference.key.trim(),
              enabled,
              order,
            };
          });
        if (Array.isArray(parsed.preferences)) {
          parsed.preferences = sanitizedPreferences;
        } else {
          parsed.prefs = sanitizedPreferences;
        }
        init.body = JSON.stringify(parsed);
      }
    } catch (parseError) {
      console.warn('Failed to sanitize column preferences request body:', parseError);
    }
  }

  const requestInit: RequestInit = {
    ...init,
    credentials: 'include',
    headers,
  };
  const response = await fetch(resolveApiUrl(path), requestInit);

  if (isTenantSessionRequest(path) && await isAuthenticationRequired(response) && await refreshSession()) {
    return fetch(resolveApiUrl(path), requestInit);
  }

  return response;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})) as ApiErrorBody;
    throw new ApiError(res.status, errorBody.message ?? `Request failed (${res.status})`, errorBody.type);
  }
  return res.json() as Promise<T>;
}
