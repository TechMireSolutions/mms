import type { FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: User & { twoFactorVerified?: boolean; tokenType?: string };
}

/**
 * Verifies JWT (cookie or Authorization header) and binds the token workspace to the request host.
 */
export async function authenticateTenant(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({
      type: 'auth_required',
      message: 'Authentication is required',
    });
    return;
  }

  const user = request.user as User & { twoFactorVerified?: boolean; tokenType?: string };
  const tenant = getRequestTenant();

  if (!tenant) {
    reply.status(403).send({
      type: 'forbidden',
      message: 'This endpoint requires a tenant subdomain',
    });
    return;
  }

  if (user.workspaceSubdomain?.toLowerCase() !== tenant.toLowerCase()) {
    reply.status(403).send({
      type: 'forbidden',
      message: 'Token is not valid for this workspace',
    });
    return;
  }

  if (user.tokenType === 'refresh') {
    reply.status(401).send({
      type: 'auth_required',
      message: 'Refresh token cannot access this resource',
    });
    return;
  }

  if (user.tokenType === 'platform_access') {
    reply.status(401).send({
      type: 'auth_required',
      message: 'Platform session cannot access tenant resources',
    });
    return;
  }

  if (user.twoFactorVerified === false) {
    reply.status(403).send({
      type: 'two_factor_required',
      message: 'Two-factor verification is required',
    });
    return;
  }
}
