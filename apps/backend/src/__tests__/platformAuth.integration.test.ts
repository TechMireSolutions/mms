import { beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';

describe('platformAuth REST API integration routes', () => {
  let isDbAvailable = false;
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    try {
      await initDb();
      isDbAvailable = true;
      app = await buildApp();
    } catch {
      console.warn('[PlatformAuth Test] Postgres unavailable. Skipping live DB integration test.');
    }
  });

  it('returns setup status from GET /api/platform/auth/setup/status', async () => {
    if (!isDbAvailable) return;
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/auth/setup/status',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.needsSetup).toBe('boolean');
    expect(typeof body.smtpConfigured).toBe('boolean');
  });

  it('returns false user state for unauthenticated GET /api/platform/auth/me', async () => {
    if (!isDbAvailable) return;
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/auth/me',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user).toBeNull();
    expect(body.isAuthenticated).toBe(false);
  });

  it('rejects invalid credentials on POST /api/platform/auth/login with 401', async () => {
    if (!isDbAvailable) return;
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/auth/login',
      payload: {
        email: 'non-existent-super-admin@apex.test',
        password: 'WrongPassword123!',
      },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.type).toBe('invalid_credentials');
  });
});
