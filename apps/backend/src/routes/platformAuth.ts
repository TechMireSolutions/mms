import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { PlatformUser } from '@mms/shared';
import { PLATFORM_MIN_PASSWORD_LENGTH } from '@mms/shared';
import { authenticatePlatform } from '../middleware/authenticatePlatform.js';
import {
  issuePlatformSession,
  loginPlatformUser,
  logoutPlatformUser,
} from '../services/platform/platformAuthService.js';
import {
  getPlatformSetupStatus,
  PlatformSetupError,
  resendPlatformSetupCode,
  startPlatformSetup,
  toPublicPlatformUser,
  verifyPlatformSetup,
} from '../services/platform/platformSetupService.js';
import {
  completePlatformPasswordReset,
  PlatformPasswordResetError,
  requestPlatformPasswordReset,
  resendPlatformPasswordReset,
  toPublicPlatformUserFromStored,
} from '../services/platform/platformPasswordResetService.js';
import {
  getPlatformUserProfile,
  PlatformProfileError,
  updatePlatformUserPassword,
  updatePlatformUserProfile,
} from '../services/platform/platformProfileService.js';
import { resolveSubdomainFromRequest } from '../lib/tenantContext.js';
import { AUTH_RATE_LIMIT } from '../lib/rateLimitConfig.js';

interface LoginBody {
  email?: string;
  password?: string;
}

interface SetupRegisterBody {
  name?: string;
  email?: string;
  password?: string;
}

interface SetupVerifyBody {
  setupId?: string;
  code?: string;
}

interface SetupResendBody {
  setupId?: string;
}

interface PasswordForgotBody {
  email?: string;
}

interface PasswordResetBody {
  resetId?: string;
  code?: string;
  password?: string;
}

interface PasswordResendBody {
  resetId?: string;
}

interface ProfilePatchBody {
  name?: string;
}

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

const loginSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 },
    },
  },
};

const setupRegisterSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: PLATFORM_MIN_PASSWORD_LENGTH },
    },
  },
};

const setupVerifySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['setupId', 'code'],
    properties: {
      setupId: { type: 'string', minLength: 8 },
      code: { type: 'string', minLength: 4, maxLength: 12 },
    },
  },
};

const setupResendSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['setupId'],
    properties: {
      setupId: { type: 'string', minLength: 8 },
    },
  },
};

const passwordForgotSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', minLength: 3 },
    },
  },
};

const passwordResetSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['resetId', 'code', 'password'],
    properties: {
      resetId: { type: 'string', minLength: 8 },
      code: { type: 'string', minLength: 4, maxLength: 12 },
      password: { type: 'string', minLength: PLATFORM_MIN_PASSWORD_LENGTH },
    },
  },
};

const passwordResendSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['resetId'],
    properties: {
      resetId: { type: 'string', minLength: 8 },
    },
  },
};

const profilePatchSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 2 },
    },
  },
};

const changePasswordSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', minLength: 1 },
      newPassword: { type: 'string', minLength: PLATFORM_MIN_PASSWORD_LENGTH },
    },
  },
};

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
  fastify.get('/setup/status', async (request, reply) => {
    if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Platform setup is only available on the main domain',
      });
    }
    return reply.send(await getPlatformSetupStatus());
  });

  await fastify.register(async function platformSetupRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post<{ Body: SetupRegisterBody }>(
      '/setup/register',
      { schema: setupRegisterSchema },
      async (request, reply) => {
        if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
          return reply.status(403).send({
            type: 'forbidden',
            message: 'Platform setup is only available on the main domain',
          });
        }

        try {
          const result = await startPlatformSetup({
            name: request.body.name!,
            email: request.body.email!,
            password: request.body.password!,
          });
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

    inner.post<{ Body: SetupVerifyBody }>(
      '/setup/verify',
      { schema: setupVerifySchema },
      async (request, reply) => {
        if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
          return reply.status(403).send({
            type: 'forbidden',
            message: 'Platform setup is only available on the main domain',
          });
        }

        try {
          const stored = await verifyPlatformSetup(request.body.setupId!, request.body.code!);
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

    inner.post<{ Body: SetupResendBody }>(
      '/setup/resend',
      { schema: setupResendSchema },
      async (request, reply) => {
        if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
          return reply.status(403).send({
            type: 'forbidden',
            message: 'Platform setup is only available on the main domain',
          });
        }

        try {
          const result = await resendPlatformSetupCode(request.body.setupId!);
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

    inner.post<{ Body: PasswordForgotBody }>(
      '/password/forgot',
      { schema: passwordForgotSchema },
      async (request, reply) => {
        if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
          return reply.status(403).send({
            type: 'forbidden',
            message: 'Platform password reset is only available on the main domain',
          });
        }

        try {
          const result = await requestPlatformPasswordReset(request.body.email!);
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

    inner.post<{ Body: PasswordResetBody }>(
      '/password/reset',
      { schema: passwordResetSchema },
      async (request, reply) => {
        if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
          return reply.status(403).send({
            type: 'forbidden',
            message: 'Platform password reset is only available on the main domain',
          });
        }

        try {
          const stored = await completePlatformPasswordReset(
            request.body.resetId!,
            request.body.code!,
            request.body.password!,
          );
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

    inner.post<{ Body: PasswordResendBody }>(
      '/password/resend',
      { schema: passwordResendSchema },
      async (request, reply) => {
        if (!assertApexHost(request.hostname, request.headers['x-forwarded-host'])) {
          return reply.status(403).send({
            type: 'forbidden',
            message: 'Platform password reset is only available on the main domain',
          });
        }

        try {
          const result = await resendPlatformPasswordReset(request.body.resetId!);
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

    inner.post<{ Body: LoginBody }>('/login', { schema: loginSchema }, async (request, reply) => {
      const subdomain = resolveSubdomainFromRequest(
        request.hostname,
        request.headers['x-forwarded-host'],
      );
      if (subdomain) {
        return reply.status(403).send({
          type: 'forbidden',
          message: 'Platform sign-in is only available on the main domain',
        });
      }

      const { email, password } = request.body;
      const user = await loginPlatformUser(email!, password!, fastify.jwt, reply);
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

  fastify.patch<{ Body: ProfilePatchBody }>(
    '/me',
    { preHandler: authenticatePlatform, schema: profilePatchSchema },
    async (request, reply) => {
      const payload = request.user as PlatformUser;
      try {
        const profile = await updatePlatformUserProfile(payload.id, request.body.name!);
        issuePlatformSession(
          { id: profile.id, email: profile.email, name: profile.name },
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

    inner.post<{ Body: ChangePasswordBody }>(
      '/change-password',
      { preHandler: authenticatePlatform, schema: changePasswordSchema },
      async (request, reply) => {
        const payload = request.user as PlatformUser;
        try {
          await updatePlatformUserPassword(
            payload.id,
            request.body.currentPassword!,
            request.body.newPassword!,
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
