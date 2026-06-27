import type { FastifyInstance } from 'fastify';
import { resolveSubdomainFromRequest, tenantStorage } from '../lib/tenantContext.js';
import { attachAccessTokenFromCookie } from '../services/auth/authCookieService.js';
import { attachPlatformTokenFromCookie } from '../services/platform/platformCookieService.js';
import { requestHostname } from '../lib/requestHost.js';

export function registerRequestHooks(app: FastifyInstance): void {
  app.addHook('onRequest', (request, reply, done) => {
    reply.header('x-request-id', request.id);
    const hostname = requestHostname(request);
    const subdomain = resolveSubdomainFromRequest(hostname);
    tenantStorage.run(subdomain, () => {
      if (subdomain) {
        attachAccessTokenFromCookie(request);
      } else {
        attachPlatformTokenFromCookie(request);
      }
      done();
    });
  });

  app.addHook('onResponse', (request, reply, done) => {
    if (reply.statusCode >= 400) {
      const user = request.user as { id?: string } | undefined;
      const tenant = resolveSubdomainFromRequest(requestHostname(request));
      request.log.warn(
        {
          reqId: request.id,
          statusCode: reply.statusCode,
          method: request.method,
          url: request.url,
          tenant,
          userId: user?.id,
        },
        'request failed',
      );
    }
    done();
  });
}
