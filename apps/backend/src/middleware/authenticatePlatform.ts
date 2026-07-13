import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PlatformUser, PlatformRole } from '@mms/shared';
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

  delete request.headers.authorization;
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
    role: payload.role as PlatformRole,
  };
}

/**
 * Hook to enforce super-user role validation for platform administration routes.
 */
export async function requireSuperUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const req = request as PlatformAuthenticatedRequest;
  if (!req.platformUser || req.platformUser.role !== 'super_user') {
    reply.status(403).send({
      type: 'forbidden',
      message: 'Only platform super-users can access this resource',
    });
  }
}
