/** Production apex domain — onboarding & platform console. */
export const DEFAULT_APP_DOMAIN = "mmsv2.aabtaab.com";

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "mail",
  "smtp",
  "ftp",
  "cdn",
  "static",
  "status",
  "help",
  "support",
  "billing",
  "dashboard",
  "login",
  "onboarding",
]);

export interface TenantUrlOptions {
  appDomain?: string;
  protocol?: string;
  port?: string | number | null;
}

/**
 * Slugify a madrasa name into a valid subdomain segment.
 */
export function slugifySubdomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validate subdomain format and reserved names.
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || subdomain.length < 2 || subdomain.length > 63) return false;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) return false;
  if (RESERVED_SUBDOMAINS.has(subdomain)) return false;
  return true;
}

/**
 * Extract tenant subdomain from hostname, or null for apex / unknown.
 */
export function parseTenantFromHost(hostname: string, appDomain: string): string | null {
  const host = hostname.toLowerCase().split(":")[0];

  if (host === appDomain || host === `www.${appDomain}`) {
    return null;
  }

  const suffix = `.${appDomain}`;
  if (host.endsWith(suffix)) {
    const sub = host.slice(0, -suffix.length);
    if (!sub || sub.includes(".")) return null;
    return isValidSubdomain(sub) ? sub : null;
  }

  // Local dev: {sub}.localhost
  if (appDomain === "localhost" && host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    if (!sub || sub.includes(".")) return null;
    return isValidSubdomain(sub) ? sub : null;
  }

  return null;
}

export function isApexHost(hostname: string, appDomain: string): boolean {
  return parseTenantFromHost(hostname, appDomain) === null;
}

/**
 * Derive the apex app domain from a browser/API host when env is unset.
 * e.g. `dar-ul-quran.mmsv2.aabtaab.com` → `mmsv2.aabtaab.com`
 */
export function inferAppDomainFromHostname(hostname: string): string | null {
  const host = hostname.toLowerCase().split(":")[0];
  if (!host || host === "localhost" || host.endsWith(".localhost")) {
    return "localhost";
  }

  if (host.startsWith("www.")) {
    const withoutWww = host.slice(4);
    const fromTenant = inferAppDomainFromHostname(withoutWww);
    return fromTenant ?? withoutWww;
  }

  const parts = host.split(".");
  if (parts.length < 3) {
    return null;
  }

  if (parts.length === 3) {
    return host;
  }

  const candidateApex = parts.slice(1).join(".");
  const sub = parts[0];
  if (sub && isValidSubdomain(sub) && parseTenantFromHost(host, candidateApex) === sub) {
    return candidateApex;
  }

  return null;
}

/** Configured domain wins; else infer from host; else production default. */
export function resolveAppDomain(
  hostname: string,
  configuredDomain?: string | null,
): string {
  const trimmed = configuredDomain?.trim();
  if (trimmed) {
    return trimmed;
  }
  const inferred = inferAppDomainFromHostname(hostname);
  if (inferred) {
    return inferred;
  }
  return DEFAULT_APP_DOMAIN;
}

/**
 * True when `origin` is the apex or a tenant workspace for `appDomain`.
 */
export function isOriginAllowedForAppDomain(origin: string, appDomain: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (host === appDomain || host === `www.${appDomain}`) {
      return true;
    }
    return parseTenantFromHost(host, appDomain) !== null;
  } catch {
    return false;
  }
}

function normalizePort(port?: string | number | null): string {
  if (port === null || port === undefined || port === "") return "";
  const p = String(port);
  if (p === "80" || p === "443") return "";
  return `:${p}`;
}

/**
 * Full origin for a tenant workspace, e.g. https://al-noor.mmsv2.aabtaab.com
 */
export function buildTenantOrigin(
  subdomain: string,
  options: TenantUrlOptions = {}
): string {
  const appDomain = options.appDomain ?? DEFAULT_APP_DOMAIN;
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
  const appDomain = options.appDomain ?? DEFAULT_APP_DOMAIN;
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
