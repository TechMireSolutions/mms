import type { FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@mms/shared';
import { isWorkspaceEnabled } from '@mms/shared';
import { bindRequestUserId, getRequestTenant } from '../lib/tenantContext.js';
import { getWorkspaceBySubdomain } from '../services/workspaceService.js';
import { sendForbidden, sendUnauthorized } from '../lib/httpErrors.js';
import { isTenantBlocked, isTokenRevoked, isUserSessionRevoked } from '../services/session.service.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: User & { twoFactorVerified?: boolean; tokenType?: string; jti?: string; iat?: number; exp?: number };
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
    await sendUnauthorized(reply);
    return;
  }

  const user = request.user as User & { twoFactorVerified?: boolean; tokenType?: string; jti?: string; iat?: number };
  const tenant = getRequestTenant();

  if (!tenant) {
    await sendForbidden(reply, 'This endpoint requires a tenant subdomain');
    return;
  }

  // Fast-path Redis tenant blocklist check
  const isBlocked = await isTenantBlocked(tenant);
  if (isBlocked) {
    await reply.status(403).send({
      type: 'workspace_disabled',
      message: 'This madrasa workspace has been disabled by the platform administrator.',
    });
    return;
  }

  // Redis-backed token and session revocation checks
  if (user.jti && (await isTokenRevoked(user.jti))) {
    await sendUnauthorized(reply, 'Session revoked');
    return;
  }

  if (user.id && user.iat && (await isUserSessionRevoked(user.id, user.iat * 1000))) {
    await sendUnauthorized(reply, 'Session revoked');
    return;
  }

  const workspace = await getWorkspaceBySubdomain(tenant);
  if (!workspace || !isWorkspaceEnabled(workspace)) {
    await reply.status(403).send({
      type: 'workspace_disabled',
      message: 'This madrasa workspace has been disabled by the platform administrator.',
    });
    return;
  }

  if (user.workspaceSubdomain?.toLowerCase() !== tenant.toLowerCase()) {
    await sendForbidden(reply, 'Token is not valid for this workspace');
    return;
  }

  if (user.tokenType === 'refresh') {
    await sendUnauthorized(reply, 'Refresh token cannot access this resource');
    return;
  }

  if (user.tokenType === 'platform_access') {
    await sendUnauthorized(reply, 'Platform session cannot access tenant resources');
    return;
  }

  if (user.twoFactorVerified === false) {
    await reply.status(403).send({
      type: 'two_factor_required',
      message: 'Two-factor authentication is required to access this resource',
    });
    return;
  }

  bindRequestUserId(user.id ? String(user.id) : null);
}

