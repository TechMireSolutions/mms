import type { FastifyPluginAsync } from 'fastify';
import {
  isOnboardingAvailable,
  establishSession,
  type User,
} from '../../../services/auth/authService.js';
import { exchangeAuthHandoff } from '../../../services/auth/authHandoffService.js';
import { patchUserUiStateBodySchema } from '@mms/shared';
import { getUserUiState, patchUserUiState } from '../../../services/auth/userUiStateService.js';
import { getRequestTenant, runWithTenant } from '../../../lib/tenantContext.js';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '../../../services/auth/authCookieService.js';
import { authenticateTenant } from '../../../middleware/authenticate.js';
import { deleteAuthArtifact } from '../../../services/auth/authArtifactService.js';
import { getJwtExpiresIn } from '../../../services/globalSettingsService.js';
import { getPublicUserById } from '../../../services/auth/userService.js';
import { rotateRefreshToken, validateRefreshToken } from '../../../services/auth/twoFactorService.js';
import { handoffBodySchema } from '../../../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { sendForbidden, sendUnauthorized } from '../../../lib/httpErrors.js';

/** Session lifecycle, UI state, refresh, onboarding status, and handoff routes. */
export const authSessionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/logout', async (_request, reply) => {
    clearAuthCookies(reply);
    return reply.send({ success: true });
  });

  fastify.get('/me', { preHandler: authenticateTenant }, async (request, reply) => {
    return reply.send({
      user: request.user as User,
      isAuthenticated: true,
    });
  });

  fastify.get('/me/ui-state', { preHandler: authenticateTenant }, async (request, reply) => {
    const user = request.user as User;
    const state = await runWithTenant(user.workspaceSubdomain, () =>
      getUserUiState(user.workspaceSubdomain, user.id),
    );
    return reply.send({ state });
  });

  fastify.patch('/me/ui-state', { preHandler: authenticateTenant }, async (request, reply) => {
    const parsed = parseRequest(patchUserUiStateBodySchema, request.body ?? {});
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const user = request.user as User;
    const newState = await runWithTenant(user.workspaceSubdomain, () =>
      patchUserUiState(user.workspaceSubdomain, user.id, parsed.data),
    );
    return reply.send({ state: newState });
  });

  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      return sendUnauthorized(reply, 'Refresh token missing');
    }

    const subdomain = getRequestTenant();
    if (!subdomain) {
      return sendForbidden(reply, 'Invalid refresh context');
    }

    const validated = await validateRefreshToken(refreshToken, subdomain);
    if (!validated) {
      clearAuthCookies(reply);
      return sendUnauthorized(reply, 'Invalid refresh token');
    }

    await deleteAuthArtifact(validated.artifactId);

    const user = await runWithTenant(subdomain, () =>
      getPublicUserById(validated.payload.userId),
    );
    if (!user || user.workspaceSubdomain.toLowerCase() !== subdomain.toLowerCase()) {
      clearAuthCookies(reply);
      return sendUnauthorized(reply, 'Invalid refresh token');
    }

    const accessExpiresIn = await getJwtExpiresIn();
    const rotated = await rotateRefreshToken(refreshToken, user, fastify.jwt, accessExpiresIn);
    if (!rotated) {
      clearAuthCookies(reply);
      return sendUnauthorized(reply, 'Invalid refresh token');
    }

    setAuthCookies(reply, rotated.accessToken, rotated.refreshToken);
    return reply.send({ user });
  });

  fastify.get('/onboarding-status', async (_request, reply) => {
    const available = await isOnboardingAvailable();
    return reply.send({ available });
  });

  fastify.post('/handoff', async (request, reply) => {
    const parsed = parseRequest(handoffBodySchema, request.body ?? {});
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { code } = parsed.data;

    const subdomain = getRequestTenant();
    if (!subdomain) {
      return sendForbidden(reply, 'Handoff is only available on a tenant subdomain');
    }

    const result = await exchangeAuthHandoff(code);
    if (!result) {
      return sendUnauthorized(reply, 'Invalid or expired handoff code');
    }

    if (result.user.workspaceSubdomain?.toLowerCase() !== subdomain.toLowerCase()) {
      return sendForbidden(reply, 'Handoff code is not valid for this workspace');
    }

    await establishSession(result.user, fastify.jwt, reply, true);
    return reply.send({ user: result.user });
  });
};
