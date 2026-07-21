import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';

vi.mock('../services/platform/platformDatabaseService.js', () => ({
  resetAndReseedDatabase: vi.fn().mockResolvedValue(undefined),
}));

describe('platformSettings REST API routes', () => {
  let isDbAvailable = false;
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    try {
      await initDb();
      isDbAvailable = true;
      app = await buildApp();
    } catch {
      console.warn('[PlatformSettings Test] Postgres connection unavailable. Skipping live DB integration test.');
    }
  });

  it('rejects unauthenticated GET /api/platform/settings with 401', async () => {
    if (!isDbAvailable) return;
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/settings',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns platform settings for super_user session', async () => {
    if (!isDbAvailable) return;

    const token = app.jwt.sign({
      id: 'p-super',
      email: 'admin@platform.com',
      name: 'Super Admin',
      role: 'super_user',
      tokenType: 'platform_access',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/settings',
      cookies: { mms_platform_access: token },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.settings).toBeDefined();
    expect(body.settings.id).toBe('global');
  });

  it('allows platform super_user to update settings via PUT /api/platform/settings', async () => {
    if (!isDbAvailable) return;

    const token = app.jwt.sign({
      id: 'p-super',
      email: 'admin@platform.com',
      name: 'Super Admin',
      role: 'super_user',
      tokenType: 'platform_access',
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/api/platform/settings',
      cookies: { mms_platform_access: token },
      payload: {
        certbotEmail: 'ssl@madrasa.com',
        syncTlsOnCreate: true,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.settings.certbotEmail).toBe('ssl@madrasa.com');
  });

  it('rejects non-super_user role from updating platform settings with 403', async () => {
    if (!isDbAvailable) return;

    const token = app.jwt.sign({
      id: 'p-admin',
      email: 'normal@platform.com',
      name: 'Normal Admin',
      role: 'admin',
      tokenType: 'platform_access',
    });

    const res = await app.inject({
      method: 'PUT',
      url: '/api/platform/settings',
      cookies: { mms_platform_access: token },
      payload: {
        certbotEmail: 'hacker@example.com',
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('validates database reset payload on POST /api/platform/settings/reset-database', async () => {
    if (!isDbAvailable) return;

    const token = app.jwt.sign({
      id: 'p-super',
      email: 'admin@platform.com',
      name: 'Super Admin',
      role: 'super_user',
      tokenType: 'platform_access',
    });

    // 1. Invalid confirmation string
    const badRes = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/reset-database',
      cookies: { mms_platform_access: token },
      payload: { confirm: 'WRONG_CONFIRMATION' },
    });
    expect(badRes.statusCode).toBe(400);

    // 2. Valid confirmation string
    const goodRes = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/reset-database',
      cookies: { mms_platform_access: token },
      payload: { confirm: 'RESET_ALL_DATABASE_DATA' },
    });
    expect(goodRes.statusCode).toBe(200);
    const body = JSON.parse(goodRes.body);
    expect(body.success).toBe(true);
  });
});
