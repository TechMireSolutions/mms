import type { FastifyInstance } from 'fastify';
import { isHostAllowedForAppDomain } from '@mms/shared';
import type { ServerConfig } from '../config/serverConfig.js';

function requestHostname(request: { hostname: string; headers: Record<string, unknown> }): string {
  const forwarded = request.headers['x-forwarded-host'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(raw ?? request.hostname ?? '')
    .split(':')[0]
    .toLowerCase();
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
