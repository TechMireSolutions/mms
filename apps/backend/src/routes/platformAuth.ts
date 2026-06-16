import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import type { PlatformUser } from '@mms/shared';
import { authenticatePlatform } from '../middleware/authenticatePlatform.js';
import { loginPlatformUser, logoutPlatformUser } from '../services/platform/platformAuthService.js';
import { resolveSubdomainFromRequest } from '../lib/tenantContext.js';
import { AUTH_RATE_LIMIT } from '../lib/rateLimitConfig.js';

interface LoginBody {
  email?: string;
  password?: string;
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

export default async function platformAuthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
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
    return reply.send({
      user: { id: payload.id, email: payload.email, name: payload.name },
      isAuthenticated: true,
    });
  });
}
