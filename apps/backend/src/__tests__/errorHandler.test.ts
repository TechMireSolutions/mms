import fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { registerErrorHandlers } from '../lib/errorHandler.js';

describe('production error handler', () => {
  const apps: ReturnType<typeof fastify>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('returns a request reference without exposing the underlying error', async () => {
    const app = fastify({
      logger: false,
      genReqId: () => 'req-password-reset-1',
    });
    apps.push(app);
    registerErrorHandlers(app, true);
    app.get('/failure', async () => {
      throw new Error('sensitive database detail');
    });

    const response = await app.inject({ method: 'GET', url: '/failure' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      type: 'server_error',
      message: 'Internal server error. Reference: req-password-reset-1',
      requestId: 'req-password-reset-1',
    });
    expect(response.body).not.toContain('sensitive database detail');
  });
});
