/** Local dev apex when no env or hostname inference is available. */
export const LOCAL_DEV_APP_DOMAIN = "localhost";

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
 * True when `hostname` is the configured MMS apex or a tenant under `appDomain`.
 * Used in production to reject Apache vhosts that incorrectly proxy other domains to MMS.
 */
export function isHostAllowedForAppDomain(hostname: string, appDomain: string): boolean {
  const host = hostname.toLowerCase().split(':')[0];
  const domain = appDomain.toLowerCase().trim();
  if (!domain || !host) return false;
  if (host === domain || host === `www.${domain}`) return true;
  return parseTenantFromHost(host, domain) !== null;
}

/**
 * Derive the apex app domain from a browser/API host when env is unset.
 * e.g. `{slug}.platform.example.com` → `platform.example.com`
 */
const APEX_3PART_LABELS = new Set([
  'platform',
  'mms',
  'mmsv2',
  'app',
  'staging',
  'dev',
  'www',
]);

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
    const sub = parts[0];
    if (sub && APEX_3PART_LABELS.has(sub)) {
      return host;
    }
    const candidateApex = parts.slice(1).join(".");
    if (sub && isValidSubdomain(sub) && parseTenantFromHost(host, candidateApex) === sub) {
      return candidateApex;
    }
    return host;
  }

  const candidateApex = parts.slice(1).join(".");
  const sub = parts[0];
  if (sub && isValidSubdomain(sub) && parseTenantFromHost(host, candidateApex) === sub) {
    return candidateApex;
  }

  return null;
}

/** Configured domain wins; else infer from host; else localhost (dev only). */
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
  return LOCAL_DEV_APP_DOMAIN;
}

/**
 * When `configuredAppDomain` is too short, a 3-part platform host can be misread as a tenant.
 * e.g. host `mmsv2.aabtaab.com` + config `aabtaab.com` → tenant `mmsv2` (wrong).
 */
export function misconfiguredAppDomainHint(
  hostname: string,
  configuredAppDomain: string,
): string | null {
  const host = hostname.toLowerCase().split(':')[0];
  const configured = configuredAppDomain.toLowerCase().trim();
  if (!configured || host === configured || host === `www.${configured}`) {
    return null;
  }

  const tenant = parseTenantFromHost(host, configured);
  if (!tenant) return null;

  const hostLabels = host.split('.');
  const configLabels = configured.split('.');
  if (hostLabels.length !== configLabels.length + 1 || !host.endsWith(`.${configured}`)) {
    return null;
  }

  // Real madrasa slugs under a correct apex are expected — not a misconfiguration.
  if (!APEX_3PART_LABELS.has(tenant)) {
    return null;
  }

  return (
      `MMS_APP_DOMAIN is "${configured}" but "${host}" is treated as tenant "${tenant}". ` +
      `Set MMS_APP_DOMAIN=${host}.`
  );
}

/**
 * Apex domain for the current request — self-corrects common MMS_APP_DOMAIN typos.
 */
export function resolveAppDomainForRequest(
  hostname: string,
  configuredDomain?: string | null,
): string {
  const host = hostname.toLowerCase().split(':')[0];
  const configured = configuredDomain?.trim();
  if (configured) {
    const hint = misconfiguredAppDomainHint(host, configured);
    if (hint && host.split('.').length === configured.split('.').length + 1) {
      return host;
    }
  }
  return resolveAppDomain(host, configured);
}

/**
 * True for local dev origins only. Production CORS should use `isOriginAllowedForAppDomain`
 * with `MMS_APP_DOMAIN` from the environment.
 */
export function isTrustedWorkspaceOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === LOCAL_DEV_APP_DOMAIN || host.endsWith(".localhost");
  } catch {
    return false;
  }
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
