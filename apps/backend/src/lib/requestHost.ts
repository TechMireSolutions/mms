function isInternalHost(host: string): boolean {
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '127.0.0.1' || host.startsWith('127.')) return true;
  return /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

export function headerHost(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? '')
    .split(':')[0]
    .toLowerCase();
}

/** Prefer Host from ProxyPreserveHost; use X-Forwarded-Host only for dev/internal proxies. */
export function requestHostname(request: { hostname: string; headers: Record<string, unknown> }): string {
  const fromHost = headerHost(request.headers.host);
  if (!isInternalHost(fromHost)) {
    return fromHost;
  }
  const fromForwarded = headerHost(request.headers['x-forwarded-host']);
  if (fromForwarded) {
    return fromForwarded;
  }
  return headerHost(request.hostname);
}
