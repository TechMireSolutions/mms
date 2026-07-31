import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PlatformAdminPermissionKey, PlatformUser } from '@mms/shared';
import { platformUserCan } from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { attachPlatformTokenFromCookie } from '../services/platform/platformCookieService.js';
import { sendForbidden, sendUnauthorized } from '../lib/httpErrors.js';

export interface PlatformAuthenticatedRequest extends FastifyRequest {
  platformUser: PlatformUser;
}

/**
 * Hook to enforce that the request is only allowed on the main domain (no tenant subdomain context).
 */
export async function requireMainDomain(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (getRequestTenant()) {
    sendForbidden(reply, 'Platform actions are only available on the main domain');
    return;
  }
}

/**
 * Apex-only JWT for platform operators (separate from tenant madrasa sessions).
 * Reloads role + permissions from DB so permission edits apply without re-login.
 */
export async function authenticatePlatform(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireMainDomain(request, reply);
  if (reply.sent) return;

  delete request.headers.authorization;
  attachPlatformTokenFromCookie(request);

  try {
    await request.jwtVerify();
  } catch {
    sendUnauthorized(reply, 'Platform authentication is required');
    return;
  }

  const payload = request.user as PlatformUser & { tokenType?: string; sessionVersion?: number };
  if (payload.tokenType !== 'platform_access') {
    sendUnauthorized(reply, 'Invalid platform session');
    return;
  }

  const { getStoredPlatformUserById, toPublicPlatformUser } = await import(
    '../services/platform/platformUserService.js'
  );
  const stored = await getStoredPlatformUserById(payload.id);
  if (!stored) {
    sendUnauthorized(reply, 'User no longer exists');
    return;
  }

  if (stored.disabledAt) {
    sendUnauthorized(reply, 'Platform account has been disabled', 'account_disabled');
    return;
  }

  if ((payload.sessionVersion ?? 0) !== stored.sessionVersion) {
    sendUnauthorized(reply, 'Platform session has been revoked', 'session_revoked');
    return;
  }

  (request as PlatformAuthenticatedRequest).platformUser = toPublicPlatformUser(stored);
}

/**
 * Hook to enforce super-user role validation for platform administration routes.
 */
export async function requireSuperUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (reply.sent) return;
  const req = request as PlatformAuthenticatedRequest;
  if (!req.platformUser || req.platformUser.role !== 'super_user') {
    sendForbidden(reply, 'Only platform super-users can access this resource');
  }
}

/**
 * Allows super-users always, or admins with the given grantable permission.
 */
export function requirePlatformPermission(permission: PlatformAdminPermissionKey) {
  return async function requirePlatformPermissionHook(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (reply.sent) return;
    const req = request as PlatformAuthenticatedRequest;
    if (!platformUserCan(req.platformUser, permission)) {
      sendForbidden(reply, `Missing platform permission: ${permission}`);
    }
  };
}
