import { env } from '@/lib/config/env';

const REFRESH_PATH = '/api/auth/refresh';

const TENANT_SESSION_EXCLUDED_PATHS = [
  '/api/auth/login',
  '/api/auth/onboard',
  '/api/auth/handoff',
  '/api/auth/2fa/verify',
  '/api/auth/2fa/resend',
  '/api/auth/onboarding-status',
] as const;

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return env.apiUrl ? `${env.apiUrl}${normalized}` : normalized;
}

export function isTenantSessionRequest(path: string): boolean {
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

  return !(TENANT_SESSION_EXCLUDED_PATHS as readonly string[]).includes(url.pathname);
}

export function sanitizeColumnPreferencesBody(path: string, init: RequestInit): RequestInit {
  if (!(path.includes('column-preferences') || path.includes('column-prefs')) || !init.body || typeof init.body !== 'string') {
    return init;
  }

  try {
    const parsed = JSON.parse(init.body);
    const rawPreferences = Array.isArray(parsed?.preferences)
      ? parsed.preferences
      : Array.isArray(parsed?.prefs)
        ? parsed.prefs
        : null;
    if (!rawPreferences) return init;

    const sanitizedPreferences = rawPreferences
      .filter((columnPreference: Record<string, unknown>) => (
        columnPreference
        && typeof columnPreference === 'object'
        && typeof columnPreference.key === 'string'
        && (columnPreference.key as string).trim().length > 0
      ))
      .map((columnPreference: Record<string, unknown>, index: number) => {
        const enabled = typeof columnPreference.enabled === 'boolean'
          ? columnPreference.enabled
          : columnPreference.enabled === 'true' || columnPreference.enabled === 1 || columnPreference.enabled === '1';
        const rawOrder = typeof columnPreference.order === 'number'
          ? columnPreference.order
          : parseFloat(String(columnPreference.order));
        const floored = Math.floor(rawOrder);
        const order = Number.isSafeInteger(floored) && floored >= 0 ? floored : index;
        return {
          key: (columnPreference.key as string).trim(),
          enabled,
          order,
        };
      });

    if (Array.isArray(parsed.preferences)) {
      parsed.preferences = sanitizedPreferences;
    } else {
      parsed.prefs = sanitizedPreferences;
    }

    return { ...init, body: JSON.stringify(parsed) };
  } catch (parseError) {
    console.warn('Failed to sanitize column preferences request body:', parseError);
    return init;
  }
}

export async function executeFetchWithTimeout(targetPath: string, baseInit: RequestInit): Promise<Response> {
  const timeoutMs = (baseInit as { timeout?: number }).timeout ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException('Request timeout', 'TimeoutError'));
  }, timeoutMs);

  let onAbort: (() => void) | undefined;
  if (baseInit.signal) {
    if (baseInit.signal.aborted) {
      clearTimeout(timeoutId);
      throw baseInit.signal.reason || new DOMException('Request aborted', 'AbortError');
    }
    onAbort = () => {
      clearTimeout(timeoutId);
      controller.abort(baseInit.signal?.reason);
    };
    baseInit.signal.addEventListener('abort', onAbort);
  }

  try {
    const response = await fetch(resolveApiUrl(targetPath), {
      ...baseInit,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  } finally {
    if (baseInit.signal && onAbort) {
      baseInit.signal.removeEventListener('abort', onAbort);
    }
  }
}

export const API_REFRESH_PATH = REFRESH_PATH;
