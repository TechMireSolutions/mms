import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { PlatformUser } from '@mms/shared';
import { authenticatePlatform } from '../../middleware/authenticatePlatform.js';
import {
  issuePlatformSession,
  loginPlatformUser,
  logoutPlatformUser,
} from '../../services/platform/platformAuthService.js';
import {
  getPlatformSetupStatus,
  PlatformSetupError,
  resendPlatformSetupCode,
  startPlatformSetup,
  toPublicPlatformUser,
  verifyPlatformSetup,
} from '../../services/platform/platformSetupService.js';
import {
  completePlatformPasswordReset,
  PlatformPasswordResetError,
  requestPlatformPasswordReset,
  resendPlatformPasswordReset,
  toPublicPlatformUserFromStored,
} from '../../services/platform/platformPasswordResetService.js';
import {
  getPlatformUserProfile,
  PlatformProfileError,
  updatePlatformUserPassword,
  updatePlatformUserProfile,
} from '../../services/platform/platformProfileService.js';
import { resolveSubdomainFromRequest } from '../../lib/tenantContext.js';
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

function assertApexHost(hostname: string, forwardedHost: string | string[] | undefined): boolean {
  return !resolveSubdomainFromRequest(hostname, forwardedHost);
}

function mapSetupError(error: PlatformSetupError): { status: number; body: Record<string, string> } {
  const statusByCode: Record<PlatformSetupError['code'], number> = {
    setup_not_needed: 409,
    invalid_email: 400,
    invalid_name: 400,
    password_too_short: 400,
    password_weak: 400,
    email_send_failed: 502,
    smtp_required: 503,
    invalid_setup: 404,
    invalid_code: 401,
    user_exists: 409,
  };
  return {
    status: statusByCode[error.code] ?? 400,
    body: { type: error.code, message: error.message },
  };
}

function mapPasswordResetError(
  error: PlatformPasswordResetError,
): { status: number; body: Record<string, string> } {
  const statusByCode: Record<PlatformPasswordResetError['code'], number> = {
    invalid_email: 400,
    password_too_short: 400,
    password_weak: 400,
    email_send_failed: 502,
    smtp_required: 503,
    invalid_reset: 404,
    invalid_code: 401,
  };
  return {
    status: statusByCode[error.code] ?? 400,
    body: { type: error.code, message: error.message },
  };
}

function mapProfileError(error: PlatformProfileError): { status: number; body: Record<string, string> } {
  const statusByCode: Record<PlatformProfileError['code'], number> = {
    invalid_name: 400,
    password_too_short: 400,
    password_weak: 400,
    invalid_current_password: 401,
    user_not_found: 404,
  };
  return {
    status: statusByCode[error.code] ?? 400,
    body: { type: error.code, message: error.message },
  };
}

export default async function platformAuthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', async (request, reply) => {
    if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Platform actions are only available on the main domain',
      });
    }
  });

  fastify.get('/setup/status', async (request, reply) => {
    return reply.send(await getPlatformSetupStatus());
  });

  await fastify.register(async function platformSetupRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/setup/register', async (request, reply) => {
        const parsed = parseRequest(platformSetupRegisterBodySchema, request.body);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);

        try {
          const result = await startPlatformSetup(parsed.data);
          return reply.send(result);
        } catch (error) {
          if (error instanceof PlatformSetupError) {
            const mapped = mapSetupError(error);
            return reply.status(mapped.status).send(mapped.body);
          }
          throw error;
        }
      },
    );

    inner.post('/setup/verify', async (request, reply) => {
        const parsed = parseRequest(platformSetupVerifyBodySchema, request.body);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);
        const { setupId, code } = parsed.data;

        try {
          const stored = await verifyPlatformSetup(setupId, code);
          const user = issuePlatformSession(
            toPublicPlatformUser(stored),
            fastify.jwt,
            reply,
          );
          return reply.send({ user });
        } catch (error) {
          if (error instanceof PlatformSetupError) {
            const mapped = mapSetupError(error);
            return reply.status(mapped.status).send(mapped.body);
          }
          throw error;
        }
      },
    );

    inner.post('/setup/resend', async (request, reply) => {
        const parsed = parseRequest(platformSetupResendBodySchema, request.body);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);

        try {
          const result = await resendPlatformSetupCode(parsed.data.setupId);
          return reply.send(result);
        } catch (error) {
          if (error instanceof PlatformSetupError) {
            const mapped = mapSetupError(error);
            return reply.status(mapped.status).send(mapped.body);
          }
          throw error;
        }
      },
    );
  });

  await fastify.register(async function platformPasswordResetRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/password/forgot', async (request, reply) => {
        const parsed = parseRequest(platformPasswordForgotBodySchema, request.body);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);

        try {
          const result = await requestPlatformPasswordReset(parsed.data.email);
          return reply.send(result);
        } catch (error) {
          if (error instanceof PlatformPasswordResetError) {
            const mapped = mapPasswordResetError(error);
            return reply.status(mapped.status).send(mapped.body);
          }
          throw error;
        }
      },
    );

    inner.post('/password/reset', async (request, reply) => {
        const parsed = parseRequest(platformPasswordResetBodySchema, request.body);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);
        const { resetId, code, password } = parsed.data;

        try {
          const stored = await completePlatformPasswordReset(resetId, code, password);
          const user = issuePlatformSession(
            toPublicPlatformUserFromStored(stored),
            fastify.jwt,
            reply,
          );
          return reply.send({ user });
        } catch (error) {
          if (error instanceof PlatformPasswordResetError) {
            const mapped = mapPasswordResetError(error);
            return reply.status(mapped.status).send(mapped.body);
          }
          throw error;
        }
      },
    );

    inner.post('/password/resend', async (request, reply) => {
        const parsed = parseRequest(platformPasswordResendBodySchema, request.body);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);

        try {
          const result = await resendPlatformPasswordReset(parsed.data.resetId);
          return reply.send(result);
        } catch (error) {
          if (error instanceof PlatformPasswordResetError) {
            const mapped = mapPasswordResetError(error);
            return reply.status(mapped.status).send(mapped.body);
          }
          throw error;
        }
      },
    );
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
      try {
        const profile = await updatePlatformUserProfile(payload.id, parsed.data.name);
        issuePlatformSession(
          { id: profile.id, email: profile.email, name: profile.name, role: profile.role },
          fastify.jwt,
          reply,
        );
        return reply.send({ user: profile });
      } catch (error) {
        if (error instanceof PlatformProfileError) {
          const mapped = mapProfileError(error);
          return reply.status(mapped.status).send(mapped.body);
        }
        throw error;
      }
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
        try {
          await updatePlatformUserPassword(
            payload.id,
            parsed.data.currentPassword,
            parsed.data.newPassword,
          );
          return reply.send({ success: true });
        } catch (error) {
          if (error instanceof PlatformProfileError) {
            const mapped = mapProfileError(error);
            return reply.status(mapped.status).send(mapped.body);
          }
          throw error;
        }
      },
    );
  });
}
