import type { FastifyReply, FastifyRequest } from 'fastify';
import type { PlatformAdminPermissionKey, PlatformUser } from '@mms/shared';
import { platformUserCan } from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { attachPlatformTokenFromCookie } from '../services/platform/platformCookieService.js';
import type { PlatformAccessTokenPayload } from '../services/platform/platformAuthService.js';
import {
  getStoredPlatformUserById,
  toPublicPlatformUser,
} from '../services/platform/platformUserService.js';
import { sendForbidden, sendUnauthorized } from '../lib/httpErrors.js';
import { isTokenRevoked } from '../services/session.service.js';

export interface PlatformAuthenticatedRequest extends FastifyRequest {
  platformUser: PlatformUser;
}

export interface PlatformOptionalAuthRequest extends FastifyRequest {
  platformUser?: PlatformUser;
}

type PlatformAuthFailureReason =
  | 'auth_required'
  | 'invalid_session'
  | 'user_missing'
  | 'account_disabled'
  | 'session_revoked';

type PlatformAuthResolveResult =
  | { ok: true; user: PlatformUser }
  | { ok: false; reason: PlatformAuthFailureReason };

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
 * Resolve platform session from cookie without writing a response.
 * Used by hard `authenticatePlatform` and soft GET `/me` probe.
 */
export async function resolvePlatformUser(
  request: FastifyRequest,
): Promise<PlatformAuthResolveResult> {
  delete request.headers.authorization;
  attachPlatformTokenFromCookie(request);

  try {
    await request.jwtVerify();
  } catch {
    return { ok: false, reason: 'auth_required' };
  }

  const payload = request.user as PlatformAccessTokenPayload;
  if (payload.tokenType !== 'platform_access') {
    return { ok: false, reason: 'invalid_session' };
  }

  if (payload.jti && (await isTokenRevoked(payload.jti))) {
    return { ok: false, reason: 'session_revoked' };
  }

  const stored = await getStoredPlatformUserById(payload.id);
  if (!stored) {
    return { ok: false, reason: 'user_missing' };
  }

  if (stored.disabledAt) {
    return { ok: false, reason: 'account_disabled' };
  }

  if ((payload.sessionVersion ?? 0) !== stored.sessionVersion) {
    return { ok: false, reason: 'session_revoked' };
  }

  return { ok: true, user: toPublicPlatformUser(stored) };
}

function sendPlatformAuthFailure(
  reply: FastifyReply,
  reason: PlatformAuthFailureReason,
): void {
  switch (reason) {
    case 'account_disabled':
      sendUnauthorized(reply, 'Platform account has been disabled', 'account_disabled');
      return;
    case 'session_revoked':
      sendUnauthorized(reply, 'Platform session has been revoked', 'session_revoked');
      return;
    case 'user_missing':
      sendUnauthorized(reply, 'User no longer exists');
      return;
    case 'invalid_session':
      sendUnauthorized(reply, 'Invalid platform session');
      return;
    case 'auth_required':
    default:
      sendUnauthorized(reply, 'Platform authentication is required');
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

  const resolved = await resolvePlatformUser(request);
  if (!resolved.ok) {
    sendPlatformAuthFailure(reply, resolved.reason);
    return;
  }

  (request as PlatformAuthenticatedRequest).platformUser = resolved.user;
}

/**
 * Soft apex probe for GET `/me`: sets `platformUser` when valid, otherwise leaves unset.
 * Never writes 401 — callers return `200 { user: null }` when absent.
 */
export async function optionalAuthenticatePlatform(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireMainDomain(request, reply);
  if (reply.sent) return;

  const resolved = await resolvePlatformUser(request);
  if (resolved.ok) {
    (request as PlatformOptionalAuthRequest).platformUser = resolved.user;
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
