import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PlatformUser } from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { attachPlatformTokenFromCookie } from '../services/platform/platformCookieService.js';

export interface PlatformAuthenticatedRequest extends FastifyRequest {
  platformUser: PlatformUser;
}

/**
 * Apex-only JWT for platform super-users (separate from tenant madrasa sessions).
 */
export async function authenticatePlatform(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const tenant = getRequestTenant();
  if (tenant) {
    reply.status(403).send({
      type: 'forbidden',
      message: 'Platform authentication is only available on the main domain',
    });
    return;
  }

  attachPlatformTokenFromCookie(request);

  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({
      type: 'auth_required',
      message: 'Platform authentication is required',
    });
    return;
  }

  const payload = request.user as PlatformUser & { tokenType?: string };
  if (payload.tokenType !== 'platform_access') {
    reply.status(401).send({
      type: 'auth_required',
      message: 'Invalid platform session',
    });
    return;
  }

  (request as PlatformAuthenticatedRequest).platformUser = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
  };
}
