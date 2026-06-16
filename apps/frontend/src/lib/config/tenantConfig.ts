import {
  DEFAULT_APP_DOMAIN,
  buildApexUrl,
  buildTenantUrl,
  type TenantUrlOptions,
} from "@mms/shared";
import { env } from "@/lib/config/env";

/** Apex domain for this deployment (localhost in dev, madrasa.app in prod). */
export function getAppDomain(): string {
  if (env.appDomain) {
    return env.appDomain;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost")) {
      return "localhost";
    }
  }
  return DEFAULT_APP_DOMAIN;
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
