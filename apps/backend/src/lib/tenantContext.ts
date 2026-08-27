import { AsyncLocalStorage } from 'node:async_hooks';
import { parseTenantFromHost, resolveAppDomainForRequest } from '@mms/shared';
import { requestHostname } from './requestHost.js';

const tenantStorage = new AsyncLocalStorage<string | null>();
const requestUserIdStorage = new AsyncLocalStorage<string | null>();

/** Returns the active tenant subdomain for the current async request, if any. */
export function getRequestTenant(): string | null {
  return tenantStorage.getStore() ?? null;
}

/** Authenticated user id for the current request (audit GUCs), if any. */
export function getRequestUserId(): string | null {
  return requestUserIdStorage.getStore() ?? null;
}

/**
 * Binds the authenticated user id for the remainder of the request.
 * Prefer `enterWith` from auth middleware so nested transactions can set `app.current_user_id`.
 */
export function bindRequestUserId(userId: string | null): void {
  requestUserIdStorage.enterWith(userId);
}

/** Runs a callback with tenant context bound (used during onboarding on apex). */
export function runWithTenant<T>(subdomain: string | null, fn: () => T): T {
  return tenantStorage.run(subdomain, fn);
}

/**
 * Binds the active tenant subdomain for the remainder of the request.
 * Uses `enterWith` so AsyncLocalStorage context persists across all Fastify lifecycle hooks.
 */
export function bindRequestTenant(subdomain: string | null): void {
  tenantStorage.enterWith(subdomain);
}

/** Extracts tenant subdomain from Host / X-Forwarded-Host (Vite dev proxy). */
export function resolveSubdomainFromRequest(
  hostHeader: string | undefined,
  forwardedHost?: string | string[] | undefined
): string | null {
  const hostname = requestHostname({
    hostname: hostHeader ?? '',
    headers: {
      host: hostHeader,
      'x-forwarded-host': forwardedHost,
    },
  });
  const appDomain = resolveAppDomainForRequest(hostname, process.env.MMS_APP_DOMAIN);
  return parseTenantFromHost(hostname, appDomain);
}

export { tenantStorage };
