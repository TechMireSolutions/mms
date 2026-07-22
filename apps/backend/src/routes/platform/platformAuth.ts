import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { PlatformUser } from '@mms/shared';
import { authenticatePlatform, requireMainDomain } from '../../middleware/authenticatePlatform.js';
import {
  issuePlatformSession,
  loginPlatformUser,
  logoutPlatformUser,
} from '../../services/platform/platformAuthService.js';
import {
  getPlatformSetupStatus,
  resendPlatformSetupCode,
  startPlatformSetup,
  verifyPlatformSetup,
} from '../../services/platform/platformSetupService.js';
import {
  toPublicPlatformUser,
  getPlatformUserProfile,
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
  platformSetupResendBodySchema,
  platformSetupVerifyBodySchema,
} from '../../validation/platformSchemas.js';
import { loginBodySchema as platformLoginBodySchema } from '../../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';



export default async function platformAuthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', requireMainDomain);

  fastify.get('/setup/status', async (request, reply) => {
    return reply.send(await getPlatformSetupStatus());
  });

  await fastify.register(async function platformSetupRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/setup/register', async (request, reply) => {
      const parsed = parseRequest(platformSetupRegisterBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const result = await startPlatformSetup(parsed.data);
      return reply.send(result);
    });

    inner.post('/setup/verify', async (request, reply) => {
      const parsed = parseRequest(platformSetupVerifyBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const { setupId, code } = parsed.data;

      const stored = await verifyPlatformSetup(setupId, code);
      const user = issuePlatformSession(
        toPublicPlatformUser(stored),
        fastify.jwt,
        reply,
      );
      return reply.send({ user });
    });

    inner.post('/setup/resend', async (request, reply) => {
      const parsed = parseRequest(platformSetupResendBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const result = await resendPlatformSetupCode(parsed.data.setupId);
      return reply.send(result);
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
      const user = await loginPlatformUser(email, password, fastify.jwt, reply);
      if (!user) {
        return reply.status(401).send({
          type: 'invalid_credentials',
          message: 'Invalid platform credentials',
        });
      }
      return reply.send({ user });
    });
  });

  fastify.post('/logout', async (_request, reply) => {
    logoutPlatformUser(reply);
    return reply.send({ success: true });
  });

  fastify.get('/me', { preHandler: authenticatePlatform }, async (request, reply) => {
    const payload = request.user as PlatformUser & { tokenType?: string };
    const profile = await getPlatformUserProfile(payload.id);
    if (!profile) {
      return reply.status(404).send({ type: 'user_not_found', message: 'Platform user not found' });
    }
    return reply.send({ user: profile, isAuthenticated: true });
  });

  fastify.patch(
    '/me',
    { preHandler: authenticatePlatform },
    async (request, reply) => {
      const parsed = parseRequest(platformProfilePatchBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const payload = request.user as PlatformUser;
      const profile = await updatePlatformUserProfile(payload.id, parsed.data.name);
      issuePlatformSession(
        { id: profile.id, email: profile.email, name: profile.name, role: profile.role },
        fastify.jwt,
        reply,
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
        const payload = request.user as PlatformUser;
        await updatePlatformUserPassword(
          payload.id,
          parsed.data.currentPassword,
          parsed.data.newPassword,
        );
        return reply.send({ success: true });
      },
    );
  });
}
