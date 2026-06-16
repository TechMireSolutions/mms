import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  loginUser,
  onboardUser,
  isOnboardingAvailable,
  completeTwoFactorLogin,
  type User,
} from '../services/auth/authService.js';
import { exchangeAuthHandoff } from '../services/auth/authHandoffService.js';
import { resendTwoFactorChallenge } from '../services/auth/twoFactorService.js';
import { resolveSubdomainFromRequest } from '../lib/tenantContext.js';
import { AUTH_RATE_LIMIT } from '../lib/rateLimitConfig.js';
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '../services/auth/authCookieService.js';
import { authenticateTenant } from '../middleware/authenticate.js';
import { authenticatePlatform } from '../middleware/authenticatePlatform.js';
import { deleteAuthArtifact } from '../services/auth/authArtifactService.js';
import { getJwtExpiresIn } from '../services/globalSettingsService.js';
import { getPublicUserById } from '../services/auth/userService.js';
import { runWithTenant } from '../lib/tenantContext.js';
import { rotateRefreshToken, validateRefreshToken } from '../services/auth/twoFactorService.js';

interface LoginBody {
  email?: string;
  password?: string;
}

interface OnboardBody {
  madrasaName?: string;
  tagline?: string;
  adminName?: string;
  email?: string;
  password?: string;
  subdomain?: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  adminPhone?: string;
  website?: string;
  footerText?: string;
}

const loginSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 }
    }
  }
};

const onboardSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['madrasaName', 'adminName', 'email', 'password', 'subdomain'],
    properties: {
      madrasaName: { type: 'string', minLength: 1 },
      tagline: { type: 'string' },
      adminName: { type: 'string', minLength: 1 },
      email: { type: 'string', minLength: 3 },
      password: { type: 'string', minLength: 6 },
      subdomain: { type: 'string', minLength: 2 },
      country: { type: 'string' },
      primaryColor: { type: 'string' },
      secondaryColor: { type: 'string' },
      logoUrl: { type: 'string' },
      adminPhone: { type: 'string' },
      website: { type: 'string' },
      footerText: { type: 'string' },
    }
  }
};

export default async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  await fastify.register(async function authRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post<{ Body: LoginBody }>('/login', { schema: loginSchema }, async (request, reply) => {
      const { email, password } = request.body;
      const subdomain = resolveSubdomainFromRequest(
        request.hostname,
        request.headers['x-forwarded-host']
      );

      if (!subdomain) {
        return reply.status(400).send({
          type: 'invalid_credentials',
          message: 'Sign in on your madrasa subdomain (e.g. your-madrasa.localhost).',
        });
      }

      const result = await loginUser(email!, password!, subdomain, fastify.jwt, reply);

      if (result) {
        if (result.requires2FA) {
          return reply.send({
            user: result.user,
            requires2FA: true,
            challengeId: result.challengeId,
          });
        }
        return reply.send({ user: result.user, requires2FA: false });
      }

      return reply.status(401).send({
        type: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    });

    inner.post<{ Body: OnboardBody }>(
      '/onboard',
      { schema: onboardSchema, preHandler: authenticatePlatform },
      async (request, reply) => {
      const body = request.body;

      try {
        const result = await onboardUser(
          {
            email: body.email!,
            adminName: body.adminName!,
            password: body.password!,
            subdomain: body.subdomain!,
            madrasaName: body.madrasaName!,
            tagline: body.tagline,
            country: body.country,
            primaryColor: body.primaryColor,
            secondaryColor: body.secondaryColor,
            logoUrl: body.logoUrl,
            adminPhone: body.adminPhone,
            website: body.website,
            footerText: body.footerText,
          },
          fastify.jwt,
          reply
        );
        return reply.send(result);
      } catch (error: unknown) {
        const err = error as Error & { statusCode?: number };
        const statusCode = err.statusCode ?? 500;
        return reply.status(statusCode).send({
          type: statusCode === 409 ? 'conflict' : 'server_error',
          message: err.message || 'Onboarding failed'
        });
      }
    });

    inner.post<{ Body: { challengeId?: string; code?: string } }>('/2fa/verify', async (request, reply) => {
      const { challengeId, code } = request.body ?? {};
      if (!challengeId || !code) {
        return reply.status(400).send({
          type: 'validation_error',
          message: 'challengeId and code are required',
        });
      }
      const result = await completeTwoFactorLogin(challengeId, code, fastify.jwt, reply);
      if (!result) {
        return reply.status(401).send({
          type: 'invalid_credentials',
          message: 'Invalid or expired verification code',
        });
      }
      return reply.send({ user: result.user, requires2FA: false });
    });

    inner.post<{ Body: { challengeId?: string } }>('/2fa/resend', async (request, reply) => {
      const challengeId = request.body?.challengeId;
      if (!challengeId) {
        return reply.status(400).send({
          type: 'validation_error',
          message: 'challengeId is required',
        });
      }
      const ok = await resendTwoFactorChallenge(challengeId);
      if (!ok) {
        return reply.status(404).send({
          type: 'not_found',
          message: 'Challenge not found or expired',
        });
      }
      return reply.send({ success: true });
    });
  });

  fastify.post('/logout', async (_request, reply) => {
    clearAuthCookies(reply);
    return reply.send({ success: true });
  });

  fastify.get('/me', { preHandler: authenticateTenant }, async (request, reply) => {
    return reply.send({
      user: request.user as User,
      isAuthenticated: true
    });
  });

  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      return reply.status(401).send({ type: 'auth_required', message: 'Refresh token missing' });
    }

    const subdomain = resolveSubdomainFromRequest(
      request.hostname,
      request.headers['x-forwarded-host'],
    );
    if (!subdomain) {
      return reply.status(403).send({ type: 'forbidden', message: 'Invalid refresh context' });
    }

    const validated = await validateRefreshToken(refreshToken, subdomain);
    if (!validated) {
      clearAuthCookies(reply);
      return reply.status(401).send({ type: 'auth_required', message: 'Invalid refresh token' });
    }

    await deleteAuthArtifact(validated.artifactId);

    const user = await runWithTenant(subdomain, () =>
      getPublicUserById(validated.payload.userId),
    );
    if (!user || user.workspaceSubdomain.toLowerCase() !== subdomain.toLowerCase()) {
      clearAuthCookies(reply);
      return reply.status(401).send({ type: 'auth_required', message: 'Invalid refresh token' });
    }

    const accessExpiresIn = await getJwtExpiresIn();
    const rotated = await rotateRefreshToken(refreshToken, user, fastify.jwt, accessExpiresIn);
    if (!rotated) {
      clearAuthCookies(reply);
      return reply.status(401).send({ type: 'auth_required', message: 'Invalid refresh token' });
    }

    setAuthCookies(reply, rotated.accessToken, rotated.refreshToken);
    return reply.send({ user });
  });

  fastify.get('/onboarding-status', async (_request, reply) => {
    const available = await isOnboardingAvailable();
    return reply.send({ available });
  });

  fastify.post<{ Body: { code?: string } }>('/handoff', async (request, reply) => {
    const code = request.body?.code;
    if (!code) {
      return reply.status(400).send({
        type: 'validation_error',
        message: 'Handoff code is required',
      });
    }
    const result = await exchangeAuthHandoff(code);
    if (!result) {
      return reply.status(401).send({
        type: 'auth_required',
        message: 'Invalid or expired handoff code',
      });
    }
    const { establishSession } = await import('../services/auth/authService.js');
    await establishSession(result.user, fastify.jwt, reply, true);
    return reply.send({ user: result.user });
  });
}
