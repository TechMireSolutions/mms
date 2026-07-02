import { parseTenantFromHost } from '@mms/shared/tenantUtils';
import { getAppDomain } from '@/lib/config/tenantConfig';

/** True when the browser host is a madrasa subdomain (not platform apex). */
export function isBrowserOnTenantHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return parseTenantFromHost(hostname, getAppDomain()) !== null;
}
