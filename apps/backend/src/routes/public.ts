import type { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify';
import { resolveAppDomainForRequest } from '@mms/shared';

function requestHostname(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-host'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (raw ?? request.hostname ?? '').split(':')[0].toLowerCase();
}

export default async function publicRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get('/deployment-config', async (request, reply) => {
    const hostname = requestHostname(request);
    const configured = process.env.MMS_APP_DOMAIN?.trim();
    const appDomain = resolveAppDomainForRequest(hostname, configured);
    return reply.send({ appDomain });
  });
}
