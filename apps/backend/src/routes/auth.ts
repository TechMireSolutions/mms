import { FastifyInstance, FastifyPluginOptions } from 'fastify';
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
import { loginBodySchema, onboardBodySchema } from '../validation/authSchemas.js';
import {
  challengeCodeBodySchema,
  challengeIdBodySchema,
  handoffBodySchema,
} from '../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';

export default async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  await fastify.register(async function authRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/login', async (request, reply) => {
      const body = parseRequest(loginBodySchema, request.body);
      if (!body.ok) return replyValidationError(reply, body.message);
      const { email, password } = body.data;
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

      try {
        const result = await loginUser(email, password, subdomain, fastify.jwt, reply);

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
      } catch (error: unknown) {
        const err = error as Error & { statusCode?: number; type?: string };
        if (err.statusCode === 403 && err.type === 'workspace_disabled') {
          return reply.status(403).send({
            type: 'workspace_disabled',
            message: err.message,
          });
        }
        throw error;
      }

      return reply.status(401).send({
        type: 'invalid_credentials',
        message: 'Invalid email or password'
      });
    });

    inner.post(
      '/onboard',
      { preHandler: authenticatePlatform },
      async (request, reply) => {
      const parsed = parseRequest(onboardBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const body = parsed.data;

      try {
        const result = await onboardUser({
          email: body.email,
          adminName: body.adminName,
          password: body.password,
          subdomain: body.subdomain,
          madrasaName: body.madrasaName,
          tagline: body.tagline,
          country: body.country,
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          logoUrl: body.logoUrl,
          adminPhone: body.adminPhone,
          website: body.website,
          footerText: body.footerText,
        });
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

    inner.post('/2fa/verify', async (request, reply) => {
      const parsed = parseRequest(challengeCodeBodySchema, request.body ?? {});
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const { challengeId, code } = parsed.data;
      const result = await completeTwoFactorLogin(challengeId, code, fastify.jwt, reply);
      if (!result) {
        return reply.status(401).send({
          type: 'invalid_credentials',
          message: 'Invalid or expired verification code',
        });
      }
      return reply.send({ user: result.user, requires2FA: false });
    });

    inner.post('/2fa/resend', async (request, reply) => {
      const parsed = parseRequest(challengeIdBodySchema, request.body ?? {});
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const { challengeId } = parsed.data;
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

  fastify.post('/handoff', async (request, reply) => {
    const parsed = parseRequest(handoffBodySchema, request.body ?? {});
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { code } = parsed.data;

    const subdomain = resolveSubdomainFromRequest(
      request.hostname,
      request.headers['x-forwarded-host'],
    );
    if (!subdomain) {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Handoff is only available on a tenant subdomain',
      });
    }

    const result = await exchangeAuthHandoff(code);
    if (!result) {
      return reply.status(401).send({
        type: 'auth_required',
        message: 'Invalid or expired handoff code',
      });
    }

    if (result.user.workspaceSubdomain?.toLowerCase() !== subdomain.toLowerCase()) {
      return reply.status(403).send({
        type: 'forbidden',
        message: 'Handoff code is not valid for this workspace',
      });
    }

    const { establishSession } = await import('../services/auth/authService.js');
    await establishSession(result.user, fastify.jwt, reply, true);
    return reply.send({ user: result.user });
  });
}
