import type { FastifyPluginAsync } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  loginUser,
  onboardUser,
  completeTwoFactorLogin,
} from '../../../services/auth/authService.js';
import { resendTwoFactorChallenge } from '../../../services/auth/twoFactorService.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { AUTH_RATE_LIMIT } from '../../../lib/rateLimitConfig.js';
import {
  authenticatePlatform,
  requirePlatformPermission,
} from '../../../middleware/authenticatePlatform.js';
import { onboardBodySchema } from '../../../validation/authSchemas.js';
import {
  challengeCodeBodySchema,
  challengeIdBodySchema,
  loginBodySchema,
} from '../../../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { sendNotFound } from '../../../lib/httpErrors.js';

/** Rate-limited login, onboarding, and two-factor challenge routes. */
export const authLoginRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(async function authRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post('/login', async (request, reply) => {
      const body = parseRequest(loginBodySchema, request.body);
      if (!body.ok) return replyValidationError(reply, body.message);
      const { email, password } = body.data;
      const subdomain = getRequestTenant();

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
        if (err.statusCode === 403 && err.type === 'email_not_verified') {
          return reply.status(403).send({
            type: 'email_not_verified',
            message: err.message,
          });
        }
        throw error;
      }

      return reply.status(401).send({
        type: 'invalid_credentials',
        message: 'Invalid email or password',
      });
    });

    inner.post(
      '/onboard',
      { preHandler: [authenticatePlatform, requirePlatformPermission('onboard')] },
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
            faviconUrl: body.faviconUrl,
            legalName: body.legalName,
            registrationNumber: body.registrationNumber,
            addressLine1: body.addressLine1,
            addressLine2: body.addressLine2,
            city: body.city,
            region: body.region,
            postalCode: body.postalCode,
            socialLinks: body.socialLinks,
            modules: body.modules,
          });
          return reply.send(result);
        } catch (error: unknown) {
          const err = error as Error & { statusCode?: number };
          const statusCode = err.statusCode ?? 500;
          return reply.status(statusCode).send({
            type: statusCode === 409 ? 'conflict' : 'server_error',
            message: err.message || 'Onboarding failed',
          });
        }
      },
    );

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
        return sendNotFound(reply, 'Challenge not found or expired');
      }
      return reply.send({ success: true });
    });
  });
};
