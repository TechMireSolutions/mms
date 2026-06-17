import {
  buildApexUrl,
  buildTenantUrl,
  isApexHost,
  resolveAppDomain,
  type TenantUrlOptions,
} from "@mms/shared";
import { env } from "@/lib/config/env";

/** Apex domain for this deployment (localhost in dev, platform domain in prod). */
export function getAppDomain(): string {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  return resolveAppDomain(hostname, env.appDomain);
}

export function getTenantUrlOptions(): TenantUrlOptions {
  if (typeof window === "undefined") {
    return { appDomain: getAppDomain() };
  }
  return {
    appDomain: getAppDomain(),
    protocol: window.location.protocol,
    port: getAppDomain() === "localhost" ? window.location.port : null,
  };
}

export function tenantUrl(subdomain: string, path = "/"): string {
  return buildTenantUrl(subdomain, path, getTenantUrlOptions());
}

export function apexUrl(path = "/"): string {
  return buildApexUrl(path, getTenantUrlOptions());
}

/** True when the current browser host is the apex domain (no tenant subdomain). */
export function isCurrentHostApex(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return isApexHost(window.location.hostname.toLowerCase(), getAppDomain());
}
