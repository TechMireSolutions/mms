import {
  LOCAL_DEV_APP_DOMAIN,
  resolveAppDomain,
} from './tenantHostUtils.js';

export interface TenantUrlOptions {
  appDomain?: string;
  protocol?: string;
  port?: string | number | null;
}

function normalizePort(port?: string | number | null): string {
  if (port === null || port === undefined || port === "") return "";
  const p = String(port);
  if (p === "80" || p === "443") return "";
  return `:${p}`;
}

function appDomainForUrlOptions(options: TenantUrlOptions): string {
  if (options.appDomain) {
    return options.appDomain;
  }
  if (typeof window !== "undefined") {
    return resolveAppDomain(window.location.hostname);
  }
  return LOCAL_DEV_APP_DOMAIN;
}

/**
 * Full origin for a tenant workspace, e.g. https://al-noor.{platform-domain}
 */
export function buildTenantOrigin(
  subdomain: string,
  options: TenantUrlOptions = {}
): string {
  const appDomain = appDomainForUrlOptions(options);
  const protocol =
    options.protocol ??
    (typeof window !== "undefined" ? window.location.protocol : "https:");
  const port =
    options.port !== undefined
      ? options.port
      : typeof window !== "undefined" && appDomain === "localhost"
        ? window.location.port
        : null;

  const host =
    appDomain === "localhost"
      ? `${subdomain}.localhost`
      : `${subdomain}.${appDomain}`;

  return `${protocol}//${host}${normalizePort(port)}`;
}

export function buildTenantUrl(
  subdomain: string,
  path = "/",
  options: TenantUrlOptions = {}
): string {
  const origin = buildTenantOrigin(subdomain, options);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

/**
 * Apex URL (onboarding / marketing) — not used for the signed-in app.
 */
export function buildApexUrl(
  path = "/",
  options: TenantUrlOptions = {}
): string {
  const appDomain = appDomainForUrlOptions(options);
  const protocol =
    options.protocol ??
    (typeof window !== "undefined" ? window.location.protocol : "https:");
  const port =
    options.port !== undefined
      ? options.port
      : typeof window !== "undefined" && appDomain === "localhost"
        ? window.location.port
        : null;

  return `${protocol}//${appDomain}${normalizePort(port)}${path.startsWith("/") ? path : `/${path}`}`;
}
