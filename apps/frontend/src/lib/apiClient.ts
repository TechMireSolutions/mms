const JSON_CONTENT_TYPE = 'application/json';

let refreshPromise: Promise<boolean> | null = null;

export interface ApiErrorBody {
  type?: string;
  message?: string;
}

/** Structured API failure — map `type` to `t('errors.*')` in UI. */
export class ApiError extends Error {
  readonly status: number;
  readonly type: string;
  readonly requestId?: string;

  constructor(status: number, message: string, type?: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type ?? (status === 401 ? 'auth_required' : status === 403 ? 'forbidden' : 'request_failed');
    this.requestId = requestId;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export { resolveApiUrl } from '@/lib/apiClientHelpers';

import {
  API_REFRESH_PATH,
  executeFetchWithTimeout,
  isTenantSessionRequest,
  resolveApiUrl,
  sanitizeColumnPreferencesBody,
} from '@/lib/apiClientHelpers';

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(resolveApiUrl(API_REFRESH_PATH), {
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

  if (!headers.has('X-Request-Id')) {
    const reqId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15);
    headers.set('X-Request-Id', reqId);
  }

  const sanitizedInit = sanitizeColumnPreferencesBody(path, init);

  const requestInit: RequestInit = {
    ...sanitizedInit,
    credentials: 'include',
    headers,
  };

  const response = await executeFetchWithTimeout(path, requestInit);

  if (isTenantSessionRequest(path) && await isAuthenticationRequired(response) && await refreshSession()) {
    return executeFetchWithTimeout(path, requestInit);
  }

  return response;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text().catch(() => '');

  if (!res.ok) {
    let errorBody: ApiErrorBody = {};
    try {
      if (text) {
        errorBody = JSON.parse(text) as ApiErrorBody;
      }
    } catch {
      errorBody = { message: text.substring(0, 100) || res.statusText || `Request failed (${res.status})` };
    }
    const requestId = res.headers.get('x-request-id') || undefined;
    throw new ApiError(res.status, errorBody.message ?? `Request failed (${res.status})`, errorBody.type, requestId);
  }

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Failed to parse success JSON response: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
  }
}
