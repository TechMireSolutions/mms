import { describe, expect, it } from 'vitest';
import {
  platformCreateAdminBodySchema,
  platformUpdateAdminPermissionsBodySchema,
} from '../platformSchemas.js';
import {
  DEFAULT_PLATFORM_ADMIN_PERMISSIONS,
  FULL_PLATFORM_ADMIN_PERMISSIONS,
  normalizePlatformAdminPermissions,
  platformUserCan,
  PLATFORM_MIN_PASSWORD_LENGTH,
} from '../platformTypes.js';

describe('platformUserCan', () => {
  it('grants all capabilities to super_user', () => {
    const user = {
      role: 'super_user' as const,
      permissions: DEFAULT_PLATFORM_ADMIN_PERMISSIONS,
    };
    expect(platformUserCan(user, 'workspaces')).toBe(true);
    expect(platformUserCan(user, 'onboard')).toBe(true);
  });

  it('uses admin permission flags', () => {
    const user = {
      role: 'admin' as const,
      permissions: { workspaces: true, onboard: false, settings: false, admins: false, system: false },
    };
    expect(platformUserCan(user, 'workspaces')).toBe(true);
    expect(platformUserCan(user, 'onboard')).toBe(false);
  });

  it('denies when user is missing', () => {
    expect(platformUserCan(null, 'workspaces')).toBe(false);
    expect(platformUserCan(undefined, 'onboard')).toBe(false);
  });
});

describe('normalizePlatformAdminPermissions', () => {
  it('defaults unknown values to false flags', () => {
    expect(normalizePlatformAdminPermissions(null)).toEqual(DEFAULT_PLATFORM_ADMIN_PERMISSIONS);
    expect(normalizePlatformAdminPermissions({ workspaces: true })).toEqual({
      workspaces: true,
      onboard: false,
      settings: false,
      admins: false,
      system: false,
    });
  });
});

describe('platform admin permission schemas', () => {
  it('defaults permissions on create when omitted', () => {
    const valid = platformCreateAdminBodySchema.safeParse({
      name: 'Admin User',
      email: 'admin2@madrasa.org',
      password: 'Password123456',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.permissions).toEqual(DEFAULT_PLATFORM_ADMIN_PERMISSIONS);
    }
    expect(PLATFORM_MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(10);
  });

  it('accepts explicit permissions on create and update', () => {
    const create = platformCreateAdminBodySchema.safeParse({
      name: 'Admin User',
      email: 'admin2@madrasa.org',
      password: 'Password123456',
      permissions: FULL_PLATFORM_ADMIN_PERMISSIONS,
    });
    expect(create.success).toBe(true);

    const update = platformUpdateAdminPermissionsBodySchema.safeParse({
      permissions: { workspaces: false, onboard: true, settings: false, admins: false, system: false },
    });
    expect(update.success).toBe(true);
  });
});
