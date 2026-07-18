import type { FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@mms/shared';
import { isWorkspaceEnabled } from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { getWorkspaceBySubdomain } from '../services/workspaceService.js';
import { sendForbidden, sendUnauthorized } from '../lib/httpErrors.js';

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
    sendUnauthorized(reply);
    return;
  }

  const user = request.user as User & { twoFactorVerified?: boolean; tokenType?: string };
  const tenant = getRequestTenant();

  if (!tenant) {
    sendForbidden(reply, 'This endpoint requires a tenant subdomain');
    return;
  }

  const workspace = await getWorkspaceBySubdomain(tenant);
  if (!workspace || !isWorkspaceEnabled(workspace)) {
    reply.status(403).send({
      type: 'workspace_disabled',
      message: 'This madrasa workspace has been disabled by the platform administrator.',
    });
    return;
  }

  if (user.workspaceSubdomain?.toLowerCase() !== tenant.toLowerCase()) {
    sendForbidden(reply, 'Token is not valid for this workspace');
    return;
  }

  if (user.tokenType === 'refresh') {
    sendUnauthorized(reply, 'Refresh token cannot access this resource');
    return;
  }

  if (user.tokenType === 'platform_access') {
    sendUnauthorized(reply, 'Platform session cannot access tenant resources');
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
