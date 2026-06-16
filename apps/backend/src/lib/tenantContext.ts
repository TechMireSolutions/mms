import { AsyncLocalStorage } from 'node:async_hooks';
import { parseTenantFromHost } from '@mms/shared';

const tenantStorage = new AsyncLocalStorage<string | null>();

/** Returns the active tenant subdomain for the current async request, if any. */
export function getRequestTenant(): string | null {
  return tenantStorage.getStore() ?? null;
}

/** Runs a callback with tenant context bound (used during onboarding on apex). */
export function runWithTenant<T>(subdomain: string | null, fn: () => T): T {
  return tenantStorage.run(subdomain, fn);
}

/** Extracts tenant subdomain from Host / X-Forwarded-Host (Vite dev proxy). */
export function resolveSubdomainFromRequest(
  hostHeader: string | undefined,
  forwardedHost?: string | string[] | undefined
): string | null {
  const rawForwarded = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  const hostname = (rawForwarded ?? hostHeader ?? '').split(':')[0].toLowerCase();
  const appDomain = process.env.MMS_APP_DOMAIN ?? 'localhost';
  return parseTenantFromHost(hostname, appDomain);
}

export { tenantStorage };
