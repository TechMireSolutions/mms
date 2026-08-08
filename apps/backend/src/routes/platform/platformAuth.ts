import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  authenticatePlatform,
  optionalAuthenticatePlatform,
  requireMainDomain,
  type PlatformAuthenticatedRequest,
  type PlatformOptionalAuthRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  issuePlatformSession,
  loginPlatformUser,
  logoutPlatformUser,
} from '../../services/platform/platformAuthService.js';
import {
  getPlatformSetupStatus,
  startPlatformSetup,
} from '../../services/platform/platformSetupService.js';
import {
  toPublicPlatformUser,
  getPlatformUserProfile,
  getStoredPlatformUserById,
  changePlatformUserPassword as updatePlatformUserPassword,
  updatePlatformUserProfile,
} from '../../services/platform/platformUserService.js';
import {
  completePlatformPasswordReset,
  requestPlatformPasswordReset,
  resendPlatformPasswordReset,
} from '../../services/platform/platformPasswordResetService.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';
import {
  platformChangePasswordBodySchema,
  platformPasswordForgotBodySchema,
  platformPasswordResendBodySchema,
  platformPasswordResetBodySchema,
  platformProfilePatchBodySchema,
  platformSetupRegisterBodySchema,
} from '../../validation/platformSchemas.js';
import { loginBodySchema as platformLoginBodySchema } from '../../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

export default async function platformAuthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', requireMainDomain);

  fastify.get('/setup/status', async (_request, reply) => {
    return reply.send(await getPlatformSetupStatus());
  });

  await fastify.register(async function platformSetupRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/setup/register', async (request, reply) => {
      const parsed = parseRequest(platformSetupRegisterBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const stored = await startPlatformSetup(parsed.data);
      const user = issuePlatformSession(
        toPublicPlatformUser(stored),
        fastify.jwt,
        reply,
        stored.sessionVersion,
      );
      return reply.send({ user });
    });
  });

  await fastify.register(async function platformPasswordResetRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/password/forgot', async (request, reply) => {
      const parsed = parseRequest(platformPasswordForgotBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const result = await requestPlatformPasswordReset(parsed.data.email);
      return reply.send(result);
    });

    inner.post('/password/reset', async (request, reply) => {
      const parsed = parseRequest(platformPasswordResetBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const { resetId, code, password } = parsed.data;

      const stored = await completePlatformPasswordReset(resetId, code, password);
      const user = issuePlatformSession(
        toPublicPlatformUser(stored),
        fastify.jwt,
        reply,
        stored.sessionVersion,
      );
      return reply.send({ user });
    });

    inner.post('/password/resend', async (request, reply) => {
      const parsed = parseRequest(platformPasswordResendBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const result = await resendPlatformPasswordReset(parsed.data.resetId);
      return reply.send(result);
    });
  });

  await fastify.register(async function platformAuthRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/login', async (request, reply) => {
      const parsed = parseRequest(platformLoginBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const { email, password } = parsed.data;
      const result = await loginPlatformUser(email, password, fastify.jwt, reply);
      if (!result.ok) {
        if (result.type === 'account_disabled') {
          return reply.status(401).send({
            type: 'account_disabled',
            message: 'Platform account has been disabled',
          });
        }
        return reply.status(401).send({
          type: 'invalid_credentials',
          message: 'Invalid platform credentials',
        });
      }
      return reply.send({ user: result.user });
    });
  });

  fastify.post('/logout', async (_request, reply) => {
    logoutPlatformUser(reply);
    return reply.send({ success: true });
  });

  fastify.get('/me', { preHandler: optionalAuthenticatePlatform }, async (request, reply) => {
    const { platformUser } = request as PlatformOptionalAuthRequest;
    if (!platformUser) {
      return reply.send({ user: null, isAuthenticated: false });
    }
    const profile = await getPlatformUserProfile(platformUser.id);
    if (!profile) {
      return reply.send({ user: null, isAuthenticated: false });
    }
    return reply.send({ user: profile, isAuthenticated: true });
  });

  fastify.patch(
    '/me',
    { preHandler: authenticatePlatform },
    async (request, reply) => {
      const parsed = parseRequest(platformProfilePatchBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const profile = await updatePlatformUserProfile(platformUser.id, parsed.data.name);
      const stored = await getStoredPlatformUserById(profile.id);
      issuePlatformSession(
        {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          permissions: profile.permissions,
        },
        fastify.jwt,
        reply,
        stored?.sessionVersion ?? 0,
      );
      return reply.send({ user: profile });
    },
  );

  await fastify.register(async function platformChangePasswordRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post(
      '/change-password',
      { preHandler: authenticatePlatform },
      async (request, reply) => {
        const parsed = parseRequest(platformChangePasswordBodySchema, request.body);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);
        const { platformUser } = request as PlatformAuthenticatedRequest;
        const stored = await updatePlatformUserPassword(
          platformUser.id,
          parsed.data.currentPassword,
          parsed.data.newPassword,
        );
        issuePlatformSession(
          toPublicPlatformUser(stored),
          fastify.jwt,
          reply,
          stored.sessionVersion,
        );
        return reply.send({ success: true });
      },
    );
  });
}
