import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';
import {
  findPlatformUserRowByEmail,
  findPlatformUserRowById,
  insertPlatformUser,
  listPlatformUsers,
} from '../db/repositories/platformUserRepository.js';
import { hashPassword } from '../services/auth/passwordService.js';

vi.mock('../services/platform/platformDatabaseService.js', () => ({
  resetAndReseedDatabase: vi.fn().mockResolvedValue(undefined),
}));

describe('platformSettings REST API routes', () => {
  let isDbAvailable = false;
  let app: FastifyInstance;
  let superUserId = 'p-super';
  let superSessionVersion = 0;
  let adminUserId = 'p-admin';
  let adminSessionVersion = 0;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    try {
      await initDb();
      isDbAvailable = true;
      app = await buildApp();

      const passwordHash = await hashPassword('TestPassword123!');

      const existingSuper =
        (await listPlatformUsers()).find((user) => user.role === 'super_user')
        ?? (await findPlatformUserRowById('p-super'));

      if (existingSuper) {
        superUserId = existingSuper.id;
        superSessionVersion = existingSuper.sessionVersion;
      } else {
        await insertPlatformUser({
          id: 'p-super',
          email: 'admin@platform.com',
          name: 'Super Admin',
          passwordHash,
          role: 'super_user',
          permissions: { workspaces: true, onboard: true },
          sessionVersion: 0,
          createdAt: new Date().toISOString(),
        });
        superUserId = 'p-super';
        superSessionVersion = 0;
      }

      const existingAdmin =
        (await findPlatformUserRowById('p-admin'))
        ?? (await findPlatformUserRowByEmail('normal@platform.com'));

      if (existingAdmin && existingAdmin.role !== 'super_user') {
        adminUserId = existingAdmin.id;
        adminSessionVersion = existingAdmin.sessionVersion;
      } else {
        await insertPlatformUser({
          id: 'p-admin',
          email: 'normal-settings-test@platform.com',
          name: 'Normal Admin',
          passwordHash,
          role: 'admin',
          permissions: { workspaces: false, onboard: false },
          sessionVersion: 0,
          createdAt: new Date().toISOString(),
        });
        adminUserId = 'p-admin';
        adminSessionVersion = 0;
      }
    } catch {
      console.warn('[PlatformSettings Test] Postgres connection unavailable. Skipping live DB integration test.');
    }
  });

  function signPlatformToken(input: {
    id: string;
    email: string;
    name: string;
    role: 'super_user' | 'admin';
    sessionVersion: number;
  }): string {
    return app.jwt.sign({
      ...input,
      permissions: input.role === 'super_user'
        ? { workspaces: true, onboard: true }
        : { workspaces: false, onboard: false },
      tokenType: 'platform_access',
    });
  }

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

    const token = signPlatformToken({
      id: superUserId,
      email: 'admin@platform.com',
      name: 'Super Admin',
      role: 'super_user',
      sessionVersion: superSessionVersion,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/settings',
      cookies: { mms_platform_access: token },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { settings: { id: string } };
    expect(body.settings).toBeDefined();
    expect(body.settings.id).toBe('global');
  });

  it('rejects non-super_user from reading platform settings with 403', async () => {
    if (!isDbAvailable) return;

    const token = signPlatformToken({
      id: adminUserId,
      email: 'normal-settings-test@platform.com',
      name: 'Normal Admin',
      role: 'admin',
      sessionVersion: adminSessionVersion,
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/platform/settings',
      cookies: { mms_platform_access: token },
    });

    expect(res.statusCode).toBe(403);
  });

  it('allows platform super_user to update settings via PUT /api/platform/settings', async () => {
    if (!isDbAvailable) return;

    const token = signPlatformToken({
      id: superUserId,
      email: 'admin@platform.com',
      name: 'Super Admin',
      role: 'super_user',
      sessionVersion: superSessionVersion,
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
    const body = JSON.parse(res.body) as { success: boolean; settings: { certbotEmail: string } };
    expect(body.success).toBe(true);
    expect(body.settings.certbotEmail).toBe('ssl@madrasa.com');
  });

  it('rejects non-super_user role from updating platform settings with 403', async () => {
    if (!isDbAvailable) return;

    const token = signPlatformToken({
      id: adminUserId,
      email: 'normal-settings-test@platform.com',
      name: 'Normal Admin',
      role: 'admin',
      sessionVersion: adminSessionVersion,
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

    const token = signPlatformToken({
      id: superUserId,
      email: 'admin@platform.com',
      name: 'Super Admin',
      role: 'super_user',
      sessionVersion: superSessionVersion,
    });

    const badRes = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/reset-database',
      cookies: { mms_platform_access: token },
      payload: { confirm: 'WRONG_CONFIRMATION', password: 'any' },
    });
    expect(badRes.statusCode).toBe(400);

    const missingPw = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/reset-database',
      cookies: { mms_platform_access: token },
      payload: { confirm: 'RESET_ALL_DATABASE_DATA' },
    });
    expect(missingPw.statusCode).toBe(400);

    const wrongPw = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/reset-database',
      cookies: { mms_platform_access: token },
      payload: { confirm: 'RESET_ALL_DATABASE_DATA', password: 'wrong-password' },
    });
    expect(wrongPw.statusCode).toBe(401);
  });

  it('rejects non-super_user from resetting database with 403', async () => {
    if (!isDbAvailable) return;

    const token = signPlatformToken({
      id: adminUserId,
      email: 'normal-settings-test@platform.com',
      name: 'Normal Admin',
      role: 'admin',
      sessionVersion: adminSessionVersion,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/settings/reset-database',
      cookies: { mms_platform_access: token },
      payload: { confirm: 'RESET_ALL_DATABASE_DATA', password: 'anything' },
    });
    expect(res.statusCode).toBe(403);
  });
});
