import type { FastifyInstance } from 'fastify';
import { isHostAllowedForAppDomain } from '@mms/shared';
import type { ServerConfig } from '../config/serverConfig.js';

function isInternalHost(host: string): boolean {
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '127.0.0.1' || host.startsWith('127.')) return true;
  return /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

function headerHost(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? '')
    .split(':')[0]
    .toLowerCase();
}

/** Prefer Host from ProxyPreserveHost; use X-Forwarded-Host only for dev/internal proxies. */
function requestHostname(request: { hostname: string; headers: Record<string, unknown> }): string {
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

/** Rejects requests whose Host is not MMS_APP_DOMAIN or a tenant subdomain. */
export function registerProductionHostGuard(
  app: FastifyInstance,
  config: ServerConfig,
): void {
  if (!config.isProd) return;

  const appDomain = process.env.MMS_APP_DOMAIN?.trim();
  if (!appDomain) return;

  app.addHook('onRequest', (request, reply, done) => {
    const host = requestHostname(request);
    if (!host || isHostAllowedForAppDomain(host, appDomain)) {
      done();
      return;
    }
    reply.status(404).send({
      type: 'not_found',
      message: 'This host is not configured for MMS',
    });
  });
}
