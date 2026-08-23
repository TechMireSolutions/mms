import { describe, expect, it } from 'vitest';
import fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import { csrfGuard } from '../middleware/csrf-guard.js';

describe('csrfGuard middleware', () => {
  async function buildTestApp() {
    const app = fastify();
    await app.register(fastifyCookie);

    app.addHook('preHandler', csrfGuard);

    app.get('/api/test', async () => ({ ok: true }));
    app.post('/api/test', async () => ({ ok: true }));
    app.put('/api/test', async () => ({ ok: true }));
    app.delete('/api/test', async () => ({ ok: true }));

    await app.ready();
    return app;
  }

  it('allows safe methods (GET) without CSRF token', async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/test',
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });

  it('rejects POST request when X-CSRF-Token is missing', async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/test',
      cookies: { csrf_token: 'secret-token-123' },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.code).toBe('CSRF_VALIDATION_FAILED');
    await app.close();
  });

  it('rejects POST request when csrf_token cookie is missing', async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/test',
      headers: { 'x-csrf-token': 'secret-token-123' },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.code).toBe('CSRF_VALIDATION_FAILED');
    await app.close();
  });

  it('rejects POST request when header and cookie tokens mismatch', async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/test',
      headers: { 'x-csrf-token': 'token-a' },
      cookies: { csrf_token: 'token-b' },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.code).toBe('CSRF_VALIDATION_FAILED');
    await app.close();
  });

  it('allows mutating requests when header matches cookie token', async () => {
    const app = await buildTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/test',
      headers: { 'x-csrf-token': 'valid-csrf-token' },
      cookies: { csrf_token: 'valid-csrf-token' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    await app.close();
  });
});
