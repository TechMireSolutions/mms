import { beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';
import {
  findPlatformUserRowByEmail,
  listPlatformUsers,
} from '../db/repositories/platformUserRepository.js';

describe('platformUsers REST API integration routes', () => {
  let isDbAvailable = false;
  let app: FastifyInstance;
  let superUserId = '';
  let superSessionVersion = 0;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    try {
      await initDb();
      isDbAvailable = true;
      app = await buildApp();

      const existingSuper =
        (await listPlatformUsers()).find((user) => user.role === 'super_user')
        ?? (await findPlatformUserRowByEmail('admin@platform.com'));

      if (existingSuper) {
        superUserId = existingSuper.id;
        superSessionVersion = existingSuper.sessionVersion;
      }
    } catch {
      console.warn('[PlatformUsers Test] Postgres unavailable. Skipping live DB integration test.');
    }
  });

  function signPlatformToken(id = superUserId, sessionVersion = superSessionVersion): string {
    return app.jwt.sign({
      id,
      tokenType: 'platform_access',
      sessionVersion,
    });
  }

  it('rejects unauthenticated GET /api/platform/users with 401', async () => {
    if (!isDbAvailable || !superUserId) return;
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/users',
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns platform users list for super_user session', async () => {
    if (!isDbAvailable || !superUserId) return;
    const token = signPlatformToken(superUserId, superSessionVersion);
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/users',
      cookies: { mms_platform_access: token },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.users)).toBe(true);
  });

  it('prevents self-disable on PATCH /api/platform/users/:id/disabled with 403', async () => {
    if (!isDbAvailable || !superUserId) return;
    const token = signPlatformToken(superUserId, superSessionVersion);
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/platform/users/${superUserId}/disabled`,
      cookies: { mms_platform_access: token },
      payload: {
        disabled: true,
        password: 'Password123!',
      },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.message).toContain('Cannot disable your own platform account');
  });

  it('prevents self-delete on DELETE /api/platform/users/:id with 403', async () => {
    if (!isDbAvailable || !superUserId) return;
    const token = signPlatformToken(superUserId, superSessionVersion);
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/platform/users/${superUserId}`,
      cookies: { mms_platform_access: token },
      payload: {
        password: 'Password123!',
      },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.message).toContain('Cannot delete your own platform account');
  });
});
