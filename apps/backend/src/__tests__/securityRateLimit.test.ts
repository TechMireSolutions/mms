import fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { registerErrorHandlers } from '../lib/errorHandler.js';
import { AUTH_RATE_LIMIT } from '../lib/rateLimitConfig.js';
import { registerSecurityPlugins } from '../plugins/security.js';

describe('security rate limiter', () => {
  const apps: ReturnType<typeof fastify>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('enforces a local limit without depending on Redis availability', async () => {
    const app = fastify({ logger: false });
    apps.push(app);
    await registerSecurityPlugins(app);
    registerErrorHandlers(app, false);
    app.post(
      '/sensitive',
      {
        preHandler: app.rateLimit({
          ...AUTH_RATE_LIMIT,
          max: 1,
        }),
      },
      async () => ({ success: true }),
    );

    const first = await app.inject({ method: 'POST', url: '/sensitive' });
    const second = await app.inject({ method: 'POST', url: '/sensitive' });

    expect(first.statusCode).toBe(200);
    expect(second.json()).toEqual({
      type: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
    });
    expect(second.statusCode).toBe(429);
    expect(typeof second.headers['retry-after']).toBe('string');
  });
});
