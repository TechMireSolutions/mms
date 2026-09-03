import type { FastifyReply, FastifyRequest } from 'fastify';
import type { User } from '@mms/shared';
import { isWorkspaceEnabled, parseSessionTimeoutMinutes } from '@mms/shared';
import { tenantSessionScope } from '../services/sessionClockService.js';
import { enforceTenantSessionClock, SESSION_EXPIRY_RESPONSE } from '../services/sessionGuardService.js';
import { tenantSessionPolicy } from '../services/sessionPolicyService.js';
import { bindRequestTenant, bindRequestUserId, getRequestTenant, resolveSubdomainFromRequest } from '../lib/tenantContext.js';
import { getWorkspaceBySubdomain } from '../services/workspaceService.js';
import { loadGlobalSettings } from '../services/globalSettingsService.js';
import { sendForbidden, sendUnauthorized } from '../lib/httpErrors.js';
import { checkSessionRevocationBatch } from '../services/session.service.js';
import { markRequestDiagnosticStage } from '../lib/requestDiagnostics.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: User & { twoFactorVerified?: boolean; tokenType?: string; jti?: string; iat?: number; exp?: number };
  /** Tenant bound after successful authentication (workspace subdomain). */
  tenant: { id: string };
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by authenticateTenant once the tenant passes all auth checks. */
    tenant?: { id: string };
  }
}

/**
 * Verifies JWT (cookie or Authorization header) and binds the token workspace to the request host.
 */
export async function authenticateTenant(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  markRequestDiagnosticStage(request, 'authentication_jwt');
  try {
    await request.jwtVerify();
  } catch {
    await sendUnauthorized(reply);
    return;
  }

  const user = request.user as User & { twoFactorVerified?: boolean; tokenType?: string; jti?: string; iat?: number };
  markRequestDiagnosticStage(request, 'authentication_tenant_context');
  let tenant = getRequestTenant();
  if (!tenant) {
    tenant = resolveSubdomainFromRequest(request.headers.host, request.headers['x-forwarded-host'] as string | string[] | undefined);
    if (tenant) {
      bindRequestTenant(tenant);
    }
  }

  if (!tenant) {
    await sendForbidden(reply, 'This endpoint requires a tenant subdomain');
    return;
  }

  // Fast-path Redis tenant blocklist + token/session revocation checks, batched
  // into a single pipelined round-trip (was three sequential round-trips).
  markRequestDiagnosticStage(request, 'authentication_tenant_blocklist');
  const { tenantBlocked, tokenRevoked, userSessionRevoked } = await checkSessionRevocationBatch({
    tenant,
    jti: user.jti,
    userId: user.id,
    issuedAtMs: user.iat ? user.iat * 1000 : undefined,
  });
  if (tenantBlocked) {
    await reply.status(403).send({
      type: 'workspace_disabled',
      message: 'This madrasa workspace has been disabled by the platform administrator.',
    });
    return;
  }

  markRequestDiagnosticStage(request, 'authentication_token_revocation');
  if (tokenRevoked) {
    await sendUnauthorized(reply, 'Session revoked');
    return;
  }

  markRequestDiagnosticStage(request, 'authentication_user_session_revocation');
  if (userSessionRevoked) {
    await sendUnauthorized(reply, 'Session revoked');
    return;
  }

  // Server-authoritative inactivity + absolute lifetime enforcement via the Redis
  // session clock for this request.
  markRequestDiagnosticStage(request, 'authentication_idle_clock');
  const sessionPolicy = tenantSessionPolicy(
    parseSessionTimeoutMinutes((await loadGlobalSettings(tenant)).sessionTimeout),
  );
  const idleScope = user.id ? tenantSessionScope(tenant, String(user.id)) : '';

  const idleOutcome = await enforceTenantSessionClock({
    scope: idleScope,
    policy: sessionPolicy,
    jti: user.jti,
    userId: user.id ? String(user.id) : undefined,
  });
  if (idleOutcome !== 'ok') {
    const expiry = SESSION_EXPIRY_RESPONSE[idleOutcome];
    await sendUnauthorized(reply, expiry.message, expiry.type);
    return;
  }

  markRequestDiagnosticStage(request, 'authentication_workspace_lookup');
  const workspace = await getWorkspaceBySubdomain(tenant);
  if (!workspace || !isWorkspaceEnabled(workspace)) {
    await reply.status(403).send({
      type: 'workspace_disabled',
      message: 'This madrasa workspace has been disabled by the platform administrator.',
    });
    return;
  }

  markRequestDiagnosticStage(request, 'authentication_claims');
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

  // Route handlers read `request.tenant?.id` to open tenant-scoped work
  // (withTenant). Bind it right before completing authentication so any
  // request reaching handlers always has the verified workspace id, never
  // `undefined` (which previously made contract routes bind the tenant
  // string "undefined" and double-transact).
  (request as AuthenticatedRequest).tenant = { id: tenant };

  bindRequestUserId(user.id ? String(user.id) : null);
}
