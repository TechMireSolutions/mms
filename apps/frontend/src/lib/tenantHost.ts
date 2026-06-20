import { parseTenantFromHost, resolveAppDomain } from '@mms/shared';
import { env } from '@/lib/config/env';

/** True when the browser host is a madrasa subdomain (not platform apex). */
export function isBrowserOnTenantHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  const appDomain = resolveAppDomain(hostname, env.appDomain);
  return parseTenantFromHost(hostname, appDomain) !== null;
}
