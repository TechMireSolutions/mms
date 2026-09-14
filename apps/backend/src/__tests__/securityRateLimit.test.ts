import fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { registerErrorHandlers } from '../lib/errorHandler.js';
import { AUTH_RATE_LIMIT } from '../lib/rateLimitConfig.js';
import { createStrictRateLimitGuard } from '../lib/rateLimitGuard.js';
import { registerSecurityPlugins } from '../plugins/security.js';

describe('security rate limiter', () => {
  const apps: ReturnType<typeof fastify>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  /**
   * Regression: `registerSecurityPlugins` now installs a GLOBAL limiter
   * (`global: true`). The plugin's preHandler-style `fastify.rateLimit()`
   * returns early once the global `onRequest` hook has run, so a stricter
   * per-route limit expressed that way would silently stop being enforced.
   * `createStrictRateLimitGuard` must keep working alongside the global limit.
   */
  it('enforces a strict per-route limit even with a global limiter registered', async () => {
    const app = fastify({ logger: false });
    apps.push(app);
    await registerSecurityPlugins(app);
    registerErrorHandlers(app, false);

    const strictLimit = createStrictRateLimitGuard(app, {
      ...AUTH_RATE_LIMIT,
      max: 1,
    });

    app.post(
      '/sensitive',
      { preHandler: strictLimit },
      async () => ({ success: true }),
    );

    const first = await app.inject({ method: 'POST', url: '/sensitive' });
    const second = await app.inject({ method: 'POST', url: '/sensitive' });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(429);
    expect(second.json()).toEqual({
      type: 'rate_limit_exceeded',
      code: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
    });
    expect(typeof second.headers['retry-after']).toBe('string');
  });

  it('does not throttle health or readiness probes', async () => {
    const app = fastify({ logger: false });
    apps.push(app);
    await registerSecurityPlugins(app);
    registerErrorHandlers(app, false);

    app.get('/health', async () => ({ ok: true }));
    app.get('/ready', async () => ({ ok: true }));

    for (let i = 0; i < 5; i += 1) {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
    }
    const ready = await app.inject({ method: 'GET', url: '/ready' });
    expect(ready.statusCode).toBe(200);
  });

  it('applies the global limit to routes that do not opt into a stricter one', async () => {
    const app = fastify({ logger: false });
    apps.push(app);
    await registerSecurityPlugins(app);
    registerErrorHandlers(app, false);

    app.get('/anything', async () => ({ ok: true }));

    const res = await app.inject({ method: 'GET', url: '/anything' });
    expect(res.statusCode).toBe(200);
    // The global limiter advertises its budget on every response.
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
  });
});
