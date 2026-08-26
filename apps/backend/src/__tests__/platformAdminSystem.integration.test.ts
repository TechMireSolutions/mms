import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';
import {
  deletePlatformUserRow,
  findPlatformUserRowByEmail,
  findPlatformUserRowById,
  insertPlatformUser,
  listPlatformUsers,
  updatePlatformUserRow,
} from '../db/repositories/platformUserRepository.js';
import { hashPassword } from '../services/auth/passwordService.js';
import { MIGRATE_AND_RESTART_CONFIRM } from '@mms/shared';

const scheduleMigrateAndRestart = vi.fn().mockReturnValue(true);
const isRemoteMigrateRestartEnabled = vi.fn().mockReturnValue(true);
const isMigrateRestartInFlight = vi.fn().mockReturnValue(false);

vi.mock('../services/platform/platformAdminService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/platform/platformAdminService.js')>();
  return {
    ...actual,
    scheduleMigrateAndRestart: (...args: unknown[]) => scheduleMigrateAndRestart(...args),
    isRemoteMigrateRestartEnabled: () => isRemoteMigrateRestartEnabled(),
    isMigrateRestartInFlight: () => isMigrateRestartInFlight(),
  };
});

describe('platform admin system migrate-and-restart', () => {
  let isDbAvailable = false;
  let app: FastifyInstance;
  let superUserId = 'p-super-migrate';
  let superSessionVersion = 0;
  let adminUserId = 'p-admin-migrate';
  let adminSessionVersion = 0;
  const superPassword = 'TestPassword123!';

  afterAll(async () => {
    if (!isDbAvailable) return;
    try {
      await deletePlatformUserRow('p-super-migrate');
      await deletePlatformUserRow('p-admin-migrate');
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    try {
      await initDb();
      isDbAvailable = true;
      app = await buildApp();

      const passwordHash = await hashPassword(superPassword);

      const existingSuper =
        (await listPlatformUsers()).find((user) => user.role === 'super_user')
        ?? (await findPlatformUserRowById('p-super-migrate'));

      if (existingSuper) {
        superUserId = existingSuper.id;
        superSessionVersion = existingSuper.sessionVersion;
      } else {
        await insertPlatformUser({
          id: 'p-super-migrate',
          email: 'migrate-super@platform.com',
          name: 'Migrate Super',
          passwordHash,
          role: 'super_user',
          permissions: { workspaces: true, onboard: true, settings: true, admins: true, system: true },
          sessionVersion: 0,
          createdAt: new Date().toISOString(),
        });
        superUserId = 'p-super-migrate';
        superSessionVersion = 0;
      }

      const existingAdmin =
        (await findPlatformUserRowById('p-admin-migrate'))
        ?? (await findPlatformUserRowByEmail('migrate-admin@platform.com'));

      if (existingAdmin && existingAdmin.role !== 'super_user') {
        adminUserId = existingAdmin.id;
        adminSessionVersion = existingAdmin.sessionVersion;
      } else {
        await insertPlatformUser({
          id: 'p-admin-migrate',
          email: 'migrate-admin@platform.com',
          name: 'Migrate Admin',
          passwordHash,
          role: 'admin',
          permissions: { workspaces: false, onboard: false, settings: false, admins: false, system: false },
          sessionVersion: 0,
          createdAt: new Date().toISOString(),
        });
        adminUserId = 'p-admin-migrate';
        adminSessionVersion = 0;
      }
    } catch {
      console.warn('[PlatformAdminSystem Test] Postgres unavailable. Skipping live DB integration test.');
    }
  });

  beforeEach(() => {
    scheduleMigrateAndRestart.mockReset().mockReturnValue(true);
    isRemoteMigrateRestartEnabled.mockReset().mockReturnValue(true);
    isMigrateRestartInFlight.mockReset().mockReturnValue(false);
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

  it('rejects unauthenticated requests with 401', async () => {
    if (!isDbAvailable) return;
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      payload: { confirm: MIGRATE_AND_RESTART_CONFIRM, password: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-super_user with 403', async () => {
    if (!isDbAvailable) return;
    const token = signPlatformToken({
      id: adminUserId,
      email: 'migrate-admin@platform.com',
      name: 'Migrate Admin',
      role: 'admin',
      sessionVersion: adminSessionVersion,
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      cookies: { mms_platform_access: token },
      payload: { confirm: MIGRATE_AND_RESTART_CONFIRM, password: superPassword },
    });
    expect(res.statusCode).toBe(403);
    expect(scheduleMigrateAndRestart).not.toHaveBeenCalled();
  });

  it('rejects tenant subdomain host with 403', async () => {
    if (!isDbAvailable) return;

    await updatePlatformUserRow(superUserId, {
      passwordHash: await hashPassword(superPassword),
    });

    const token = signPlatformToken({
      id: superUserId,
      email: 'migrate-super@platform.com',
      name: 'Migrate Super',
      role: 'super_user',
      sessionVersion: superSessionVersion,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      headers: { host: 'demo.localhost' },
      cookies: { mms_platform_access: token },
      payload: { confirm: MIGRATE_AND_RESTART_CONFIRM, password: superPassword },
    });
    expect(res.statusCode).toBe(403);
    expect(scheduleMigrateAndRestart).not.toHaveBeenCalled();
  });

  it('rejects when remote migrate-restart is disabled', async () => {
    if (!isDbAvailable) return;
    isRemoteMigrateRestartEnabled.mockReturnValue(false);
    const token = signPlatformToken({
      id: superUserId,
      email: 'migrate-super@platform.com',
      name: 'Migrate Super',
      role: 'super_user',
      sessionVersion: superSessionVersion,
    });
    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      cookies: { mms_platform_access: token },
      payload: { confirm: MIGRATE_AND_RESTART_CONFIRM, password: superPassword },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ type: 'remote_migrate_disabled' });
    expect(scheduleMigrateAndRestart).not.toHaveBeenCalled();
  });

  it('validates confirmation and password', async () => {
    if (!isDbAvailable) return;
    const token = signPlatformToken({
      id: superUserId,
      email: 'migrate-super@platform.com',
      name: 'Migrate Super',
      role: 'super_user',
      sessionVersion: superSessionVersion,
    });

    const badConfirm = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      cookies: { mms_platform_access: token },
      payload: { confirm: 'WRONG', password: superPassword },
    });
    expect(badConfirm.statusCode).toBe(400);

    const wrongPw = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      cookies: { mms_platform_access: token },
      payload: { confirm: MIGRATE_AND_RESTART_CONFIRM, password: 'wrong-password' },
    });
    expect(wrongPw.statusCode).toBe(401);
    expect(scheduleMigrateAndRestart).not.toHaveBeenCalled();
  });

  it('accepts migrate-and-restart for super_user and schedules work', async () => {
    if (!isDbAvailable) return;

    await updatePlatformUserRow(superUserId, {
      passwordHash: await hashPassword(superPassword),
    });

    const token = signPlatformToken({
      id: superUserId,
      email: 'migrate-super@platform.com',
      name: 'Migrate Super',
      role: 'super_user',
      sessionVersion: superSessionVersion,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      cookies: { mms_platform_access: token },
      payload: { confirm: MIGRATE_AND_RESTART_CONFIRM, password: superPassword },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { accepted?: boolean; success?: boolean; delayMs?: number };
    expect(body.accepted).toBe(true);
    expect(body.success).toBe(true);
    expect(typeof body.delayMs).toBe('number');
    expect(scheduleMigrateAndRestart).toHaveBeenCalledTimes(1);
    expect(scheduleMigrateAndRestart.mock.calls[0]?.[0]).toMatchObject({
      userId: superUserId,
    });
  });

  it('returns 409 when a migrate-and-restart is already in flight', async () => {
    if (!isDbAvailable) return;
    scheduleMigrateAndRestart.mockReturnValue(false);

    await updatePlatformUserRow(superUserId, {
      passwordHash: await hashPassword(superPassword),
    });

    const token = signPlatformToken({
      id: superUserId,
      email: 'migrate-super@platform.com',
      name: 'Migrate Super',
      role: 'super_user',
      sessionVersion: superSessionVersion,
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/platform/admin/system/migrate-and-restart',
      cookies: { mms_platform_access: token },
      payload: { confirm: MIGRATE_AND_RESTART_CONFIRM, password: superPassword },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ type: 'migrate_restart_in_progress' });
    expect(scheduleMigrateAndRestart).toHaveBeenCalledTimes(1);
  });
});
