import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { initDb } from '../db/database.js';
import { buildApp } from '../app.js';
import {
  deletePlatformUserRow,
  findPlatformUserRowById,
  insertPlatformUser,
  listPlatformUsers,
} from '../db/repositories/platformUserRepository.js';
import { hashPassword } from '../services/auth/passwordService.js';
import {
  getPlatformTelemetry,
  getPlatformActivityTrend,
} from '../services/platform/platformTelemetryService.js';

describe('Platform Telemetry & Activity Trend API', () => {
  let isDbAvailable = false;
  let app: FastifyInstance;
  let superUserId = 'p-super-telem';
  let superSessionVersion = 0;
  let adminUserId = 'p-admin-no-sys';
  let adminSessionVersion = 0;
  const superPassword = 'TestPassword123!';

  afterAll(async () => {
    if (!isDbAvailable) return;
    try {
      await deletePlatformUserRow('p-super-telem');
      await deletePlatformUserRow('p-admin-no-sys');
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
        (await listPlatformUsers()).find((user) => user.role === 'super_user') ??
        (await findPlatformUserRowById('p-super-telem'));

      if (existingSuper) {
        superUserId = existingSuper.id;
        superSessionVersion = existingSuper.sessionVersion;
      } else {
        await insertPlatformUser({
          id: 'p-super-telem',
          email: 'telem-super@platform.com',
          name: 'Telem Super',
          passwordHash,
          role: 'super_user',
          permissions: { workspaces: true, onboard: true, settings: true, admins: true, system: true },
          sessionVersion: 0,
          createdAt: new Date().toISOString(),
        });
        superUserId = 'p-super-telem';
        superSessionVersion = 0;
      }

      await insertPlatformUser({
        id: 'p-admin-no-sys',
        email: 'telem-admin-nosys@platform.com',
        name: 'Telem Admin NoSys',
        passwordHash,
        role: 'admin',
        permissions: { workspaces: true, onboard: false, settings: false, admins: false, system: false },
        sessionVersion: 0,
        createdAt: new Date().toISOString(),
      });
      adminUserId = 'p-admin-no-sys';
      adminSessionVersion = 0;
    } catch {
      console.warn('[PlatformTelemetry Test] Postgres unavailable. Skipping live DB integration test.');
    }
  });

  function signPlatformToken(input: {
    id: string;
    email: string;
    name: string;
    role: 'super_user' | 'admin';
    sessionVersion: number;
    permissions?: Record<string, boolean>;
  }): string {
    return app.jwt.sign({
      ...input,
      permissions: input.permissions ?? (input.role === 'super_user'
        ? { workspaces: true, onboard: true, settings: true, admins: true, system: true }
        : { workspaces: true, onboard: false, settings: false, admins: false, system: false }),
      tokenType: 'platform_access',
    });
  }

  describe('Service unit checks', () => {
    it('returns valid telemetry shape from getPlatformTelemetry()', async () => {
      const telemetry = await getPlatformTelemetry();
      expect(telemetry).toBeDefined();
      expect(telemetry.dbPool).toBeDefined();
      expect(typeof telemetry.dbPool.totalCount).toBe('number');
      expect(typeof telemetry.dbPool.utilizationRate).toBe('number');
      expect(telemetry.memory).toBeDefined();
      expect(typeof telemetry.memory.rssMb).toBe('number');
      expect(typeof telemetry.latencyMs).toBe('number');
      expect(typeof telemetry.uptimeSeconds).toBe('number');
    });

    it('returns valid activity trend list from getPlatformActivityTrend()', async () => {
      const trend = await getPlatformActivityTrend(6);
      expect(Array.isArray(trend)).toBe(true);
      expect(trend.length).toBe(6);
      expect(trend[0]).toHaveProperty('month');
      expect(trend[0]).toHaveProperty('yearMonth');
      expect(trend[0]).toHaveProperty('tenants');
      expect(trend[0]).toHaveProperty('ops');
    });
  });

  describe('HTTP endpoint checks', () => {
    it('rejects unauthenticated requests to /telemetry with 401', async () => {
      if (!isDbAvailable) return;
      const res = await app.inject({
        method: 'GET',
        url: '/api/platform/admin/system/telemetry',
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects users without system permission with 403', async () => {
      if (!isDbAvailable) return;
      const token = signPlatformToken({
        id: adminUserId,
        email: 'telem-admin-nosys@platform.com',
        name: 'Telem Admin NoSys',
        role: 'admin',
        sessionVersion: adminSessionVersion,
        permissions: { system: false },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/platform/admin/system/telemetry',
        cookies: { mms_platform_access: token },
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns telemetry data for authorized platform super user', async () => {
      if (!isDbAvailable) return;
      const token = signPlatformToken({
        id: superUserId,
        email: 'telem-super@platform.com',
        name: 'Telem Super',
        role: 'super_user',
        sessionVersion: superSessionVersion,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/platform/admin/system/telemetry',
        cookies: { mms_platform_access: token },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json).toHaveProperty('dbPool');
      expect(json).toHaveProperty('memory');
      expect(json).toHaveProperty('latencyMs');
      expect(json).toHaveProperty('uptimeSeconds');
    });

    it('returns activity trend data for authorized platform super user', async () => {
      if (!isDbAvailable) return;
      const token = signPlatformToken({
        id: superUserId,
        email: 'telem-super@platform.com',
        name: 'Telem Super',
        role: 'super_user',
        sessionVersion: superSessionVersion,
      });

      const res = await app.inject({
        method: 'GET',
        url: '/api/platform/admin/system/activity-trend',
        cookies: { mms_platform_access: token },
      });
      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json).toHaveProperty('trend');
      expect(Array.isArray(json.trend)).toBe(true);
      expect(json.trend.length).toBe(6);
    });
  });
});
