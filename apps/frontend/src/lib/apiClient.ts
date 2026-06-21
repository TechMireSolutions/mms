import { env } from '@/lib/config/env';

const JSON_CONTENT_TYPE = 'application/json';

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

/** Cookie-first API client (`credentials: 'include'`). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? {});
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!headers.has('Content-Type') && init.body && !isFormData) {
    headers.set('Content-Type', JSON_CONTENT_TYPE);
  }

  // Intercept and sanitize any outgoing column-prefs payload to guarantee zero-trust schema compliance
  if (path.includes('column-prefs') && init.body && typeof init.body === 'string') {
    try {
      const parsed = JSON.parse(init.body);
      if (parsed && Array.isArray(parsed.prefs)) {
        parsed.prefs = parsed.prefs
          .filter((p: any) => p && typeof p === 'object' && typeof p.key === 'string' && p.key.trim().length > 0)
          .map((p: any, index: number) => {
            const enabled = typeof p.enabled === 'boolean'
              ? p.enabled
              : p.enabled === 'true' || p.enabled === 1 || p.enabled === '1';
            const rawOrder = typeof p.order === 'number' ? p.order : parseFloat(String(p.order));
            const floored = Math.floor(rawOrder);
            const order = Number.isSafeInteger(floored) && floored >= 0 ? floored : index;
            return {
              key: p.key.trim(),
              enabled,
              order,
            };
          });
        init.body = JSON.stringify(parsed);
      }
    } catch (e) {
      console.warn('Failed to sanitize column preferences request body:', e);
    }
  }

  return fetch(resolveApiUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as ApiErrorBody;
    throw new ApiError(res.status, err.message ?? `Request failed (${res.status})`, err.type);
  }
  return res.json() as Promise<T>;
}
