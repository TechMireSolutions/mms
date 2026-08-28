import { beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';
import {
  findPlatformUserRowByEmail,
  listPlatformUsers,
} from '../db/repositories/platformUserRepository.js';

describe('platformWorkspaces REST API integration routes', () => {
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
      console.warn('[PlatformWorkspaces Test] Postgres unavailable. Skipping live DB integration test.');
    }
  });

  function signPlatformToken(): string {
    return app.jwt.sign({
      id: superUserId,
      tokenType: 'platform_access',
      sessionVersion: superSessionVersion,
    });
  }

  it('rejects unauthenticated GET /api/platform/workspaces with 401', async () => {
    if (!isDbAvailable || !superUserId) return;
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/workspaces',
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects unauthenticated PATCH /api/platform/workspaces/:subdomain/email-verification with 401', async () => {
    if (!isDbAvailable || !superUserId) return;
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/platform/workspaces/test-workspace/email-verification',
      payload: { requireEmailVerification: false },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns workspace array for authenticated super-user session', async () => {
    if (!isDbAvailable || !superUserId) return;
    const token = signPlatformToken();
    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/workspaces',
      cookies: { mms_platform_access: token },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.workspaces)).toBe(true);
  });
});
