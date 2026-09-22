import { env } from '@/lib/config/env';
import { reportClientWarn } from '@/lib/clientErrorReporting';

/** Tenant auth endpoint paths — SSOT for AuthContext.tsx, twoFactor.ts, and the session interceptor. */
export const AUTH_PATHS = {
  me: '/api/auth/me',
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  refresh: '/api/auth/refresh',
  onboard: '/api/auth/onboard',
  handoff: '/api/auth/handoff',
  onboardingStatus: '/api/auth/onboarding-status',
  twoFactorVerify: '/api/auth/2fa/verify',
  twoFactorResend: '/api/auth/2fa/resend',
  sessionExtend: '/api/auth/session/extend',
  forgotPassword: '/api/auth/forgot-password',
  forgotPasswordVerify: '/api/auth/forgot-password/verify',
  forgotPasswordReset: '/api/auth/forgot-password/reset',
  verifyPassword: '/api/auth/verify-password',
  uiState: '/api/auth/me/ui-state',
} as const;

/** Platform auth endpoint paths — SSOT for PlatformAuthContext.tsx, usePlatformProfile.ts, and usePlatformSessionTimeout.tsx. */
export const PLATFORM_AUTH_PATHS = {
  me: '/api/platform/auth/me',
  login: '/api/platform/auth/login',
  logout: '/api/platform/auth/logout',
  twoFactorVerify: '/api/platform/auth/2fa/verify',
  twoFactorResend: '/api/platform/auth/2fa/resend',
  sessionExtend: '/api/platform/auth/session/extend',
  sessionPolicy: '/api/platform/auth/session/policy',
  passwordForgot: '/api/platform/auth/password/forgot',
  passwordReset: '/api/platform/auth/password/reset',
  passwordResend: '/api/platform/auth/password/resend',
  changePassword: '/api/platform/auth/change-password',
  setupStatus: '/api/platform/auth/setup/status',
  setupRegister: '/api/platform/auth/setup/register',
} as const;

const REFRESH_PATH = AUTH_PATHS.refresh;

// Set for O(1) membership test — excluded from the token-refresh interceptor.
const TENANT_SESSION_EXCLUDED_PATHS: Set<string> = new Set([
  AUTH_PATHS.login,
  AUTH_PATHS.onboard,
  AUTH_PATHS.handoff,
  AUTH_PATHS.twoFactorVerify,
  AUTH_PATHS.twoFactorResend,
  AUTH_PATHS.onboardingStatus,
  // Auth-check endpoint: a 401 here means "not logged in", not a mid-session expiry.
  // Attempting a refresh is circular — the refresh interceptor is for protected resources
  // that unexpectedly lose their session, not for the initial auth-determination call.
  // Session-expiry types (session_idle_expired / session_absolute_expired) are handled
  // separately in isAuthenticationRequired() and still fire notifySessionExpired.
  AUTH_PATHS.me,
]);


export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return env.apiUrl ? `${env.apiUrl}${normalized}` : normalized;
}

export function isTenantSessionRequest(path: string): boolean {
  const apiOrigin =
    env.apiUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

  const resolved = resolveApiUrl(path);

  // URL.canParse() is the modern guard (Node 22+, Chrome 120+, Safari 17.2+).
  // It avoids the try/catch anti-pattern for control flow.
  if (!URL.canParse(resolved, apiOrigin) || !URL.canParse(apiOrigin)) return false;

  const url = new URL(resolved, apiOrigin);
  const expectedOrigin = new URL(apiOrigin).origin;

  if (url.origin !== expectedOrigin || !url.pathname.startsWith('/api/')) return false;
  if (url.pathname.startsWith('/api/platform/')) return false;
  if (url.pathname === REFRESH_PATH || url.pathname === AUTH_PATHS.logout) return false;

  return !TENANT_SESSION_EXCLUDED_PATHS.has(url.pathname);
}

// ---------------------------------------------------------------------------
// Column-preference body sanitiser
// ---------------------------------------------------------------------------

interface RawColumnPreferenceEntry {
  key: string;
  enabled?: unknown;
  order?: unknown;
  width?: unknown;
  [key: string]: unknown;
}

interface SanitizedColumnPreferenceEntry {
  key: string;
  enabled: boolean;
  order: number;
  width?: number;
}

function isColumnPreferenceEntry(value: unknown): value is RawColumnPreferenceEntry {
  if (typeof value !== 'object' || value === null) return false;
  const key = (value as Record<string, unknown>).key;
  return typeof key === 'string' && key.trim().length > 0;
}

function coerceEnabled(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  return raw === 'true' || raw === 1 || raw === '1';
}

function coerceOrder(raw: unknown, fallback: number): number {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
  const floored = Math.floor(num);
  return Number.isSafeInteger(floored) && floored >= 0 ? floored : fallback;
}

function coerceWidth(raw: unknown): number | undefined {
  return typeof raw === 'number' && raw > 0 ? Math.round(raw) : undefined;
}

function sanitizeColumnPreferences(
  rawPrefs: unknown[],
): SanitizedColumnPreferenceEntry[] {
  return rawPrefs
    .filter(isColumnPreferenceEntry)
    .map((pref, index): SanitizedColumnPreferenceEntry => {
      const width = coerceWidth(pref.width);
      return {
        key: pref.key.trim(),
        enabled: coerceEnabled(pref.enabled),
        order: coerceOrder(pref.order, index),
        ...(width !== undefined ? { width } : {}),
      };
    });
}

export function sanitizeColumnPreferencesBody(path: string, init: RequestInit): RequestInit {
  if (
    !(path.includes('column-preferences') || path.includes('column-prefs')) ||
    !init.body ||
    typeof init.body !== 'string'
  ) {
    return init;
  }

  try {
    const parsed = JSON.parse(init.body) as Record<string, unknown>;
    const rawPreferences = Array.isArray(parsed.preferences)
      ? parsed.preferences
      : Array.isArray(parsed.prefs)
        ? parsed.prefs
        : null;

    if (!rawPreferences) return init;

    const sanitized = sanitizeColumnPreferences(rawPreferences);

    const updated = {
      ...parsed,
      ...(Array.isArray(parsed.preferences)
        ? { preferences: sanitized }
        : { prefs: sanitized }),
    };

    return { ...init, body: JSON.stringify(updated) };
  } catch (parseError) {
    reportClientWarn(parseError, { context: 'api.sanitizeColumnPreferences' });
    return init;
  }
}

// ---------------------------------------------------------------------------
// Fetch with per-request timeout
// ---------------------------------------------------------------------------

/** Extends RequestInit with an optional per-request deadline (ms). */
export interface FetchWithTimeoutOptions extends RequestInit {
  /** Request timeout in milliseconds. Defaults to 15 000. */
  timeout?: number;
}

/**
 * fetch() wrapper that races the request against AbortSignal.timeout().
 * Uses AbortSignal.any() to merge caller-supplied signals with the deadline.
 *
 * Both APIs are unconditionally available on the project's minimum targets:
 *   AbortSignal.timeout — Node ≥ 17.3, Chrome ≥ 103
 *   AbortSignal.any    — Node ≥ 20.3, Chrome ≥ 116
 * No feature-detect fallback is needed or maintained.
 */
export async function executeFetchWithTimeout(
  targetPath: string,
  baseInit: FetchWithTimeoutOptions,
): Promise<Response> {
  const timeoutMs = baseInit.timeout ?? 15_000;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = baseInit.signal
    ? AbortSignal.any([baseInit.signal, timeoutSignal])
    : timeoutSignal;

  return fetch(resolveApiUrl(targetPath), { ...baseInit, signal });
}

export const API_REFRESH_PATH = REFRESH_PATH;
