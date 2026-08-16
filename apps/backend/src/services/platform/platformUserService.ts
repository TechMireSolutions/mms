import { randomBytes } from 'node:crypto';
import type {
  PlatformUser,
  StoredPlatformUser,
  PlatformRole,
  PlatformUserProfile,
  PlatformAdminPermissions,
} from '@mms/shared';
import {
  DEFAULT_PLATFORM_ADMIN_PERMISSIONS,
  FULL_PLATFORM_ADMIN_PERMISSIONS,
  normalizePlatformAdminPermissions,
} from '@mms/shared';
import {
  countPlatformUserRows,
  findPlatformUserRowByEmail,
  findPlatformUserRowById,
  insertPlatformUser,
  updatePlatformUserRow,
  updatePlatformUserPermissions,
  deletePlatformUserRow,
} from '../../db/repositories/platformUserRepository.js';
import { hashPassword, verifyPassword } from '../auth/passwordService.js';
import { PlatformError } from './platformErrorService.js';
import { isUniqueViolation } from '../../lib/pgErrors.js';

export async function countPlatformUsers(): Promise<number> {
  return countPlatformUserRows();
}

export async function hasPlatformUsers(): Promise<boolean> {
  return (await countPlatformUserRows()) > 0;
}

export function toPlatformUserProfile(stored: StoredPlatformUser): PlatformUserProfile {
  return {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    role: stored.role,
    permissions: stored.permissions,
    createdAt: stored.createdAt,
    emailVerifiedAt: stored.emailVerifiedAt,
    disabledAt: stored.disabledAt ?? null,
  };
}

export async function getPlatformUserProfile(userId: string): Promise<PlatformUserProfile | null> {
  const stored = await getStoredPlatformUserById(userId);
  if (!stored) return null;
  return toPlatformUserProfile(stored);
}

export async function updatePlatformUserProfile(
  userId: string,
  name: string,
): Promise<PlatformUserProfile> {
  const stored = await getStoredPlatformUserById(userId);
  if (!stored) throw new PlatformError('user_not_found', 'Platform user not found');
  const updated = await updatePlatformUserName(userId, name);
  return toPlatformUserProfile(updated);
}

export async function changePlatformUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<StoredPlatformUser> {
  const stored = await findPlatformUserRowById(userId);
  if (!stored) throw new PlatformError('user_not_found', 'Platform user not found');

  const ok = await verifyPassword(currentPassword, stored.passwordHash);
  if (!ok) throw new PlatformError('invalid_current_password', 'Current password is incorrect');

  const updated = await updatePlatformUserRow(userId, {
    passwordHash: await hashPassword(newPassword),
    sessionVersion: stored.sessionVersion + 1,
  });
  if (!updated) throw new PlatformError('user_not_found', 'Platform user not found');
  return updated;
}

export async function createVerifiedPlatformUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role?: PlatformRole;
  permissions?: PlatformAdminPermissions;
}): Promise<StoredPlatformUser> {
  const existing = await findPlatformUserByEmail(input.email);
  if (existing) throw new PlatformError('user_exists', 'Platform user already exists');

  const count = await countPlatformUsers();
  if (input.role === undefined && count > 0) {
    throw new PlatformError('setup_not_needed', 'Platform administrator already exists');
  }

  const role = input.role ?? (count === 0 ? 'super_user' : 'admin');
  const permissions =
    role === 'super_user'
      ? FULL_PLATFORM_ADMIN_PERMISSIONS
      : normalizePlatformAdminPermissions(
          input.permissions ?? DEFAULT_PLATFORM_ADMIN_PERMISSIONS,
        );

  const user: StoredPlatformUser = {
    id: randomBytes(8).toString('hex'),
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: input.passwordHash,
    role,
    permissions,
    sessionVersion: 0,
    createdAt: new Date().toISOString(),
    emailVerifiedAt: new Date().toISOString(),
  };

  try {
    await insertPlatformUser(user);
  } catch (error: unknown) {
    if (isUniqueViolation(error) && role === 'super_user') {
      throw new PlatformError('setup_not_needed', 'Platform administrator already exists');
    }
    throw error;
  }
  return user;
}

export async function setPlatformAdminPermissions(
  userId: string,
  permissions: PlatformAdminPermissions,
): Promise<PlatformUserProfile> {
  const stored = await getStoredPlatformUserById(userId);
  if (!stored) throw new PlatformError('user_not_found', 'Platform user not found');
  if (stored.role === 'super_user') {
    throw new PlatformError('forbidden', 'Cannot change permissions for a platform super-user');
  }

  const updated = await updatePlatformUserPermissions(
    userId,
    normalizePlatformAdminPermissions(permissions),
  );
  if (!updated) throw new PlatformError('user_not_found', 'Platform user not found');
  return toPlatformUserProfile(updated);
}

/** Soft-disable or re-enable a platform admin. Super-users cannot be disabled. */
export async function setPlatformAdminDisabled(
  userId: string,
  disabled: boolean,
): Promise<PlatformUserProfile> {
  const stored = await getStoredPlatformUserById(userId);
  if (!stored) throw new PlatformError('user_not_found', 'Platform user not found');
  if (stored.role === 'super_user') {
    throw new PlatformError('forbidden', 'Cannot disable a platform super-user');
  }

  const updated = await updatePlatformUserRow(userId, {
    disabledAt: disabled ? new Date().toISOString() : null,
    sessionVersion: disabled ? stored.sessionVersion + 1 : stored.sessionVersion,
  });
  if (!updated) throw new PlatformError('user_not_found', 'Platform user not found');
  return toPlatformUserProfile(updated);
}

/** Permanently remove a platform admin. Super-users cannot be deleted. */
export async function deletePlatformAdmin(userId: string): Promise<void> {
  const stored = await getStoredPlatformUserById(userId);
  if (!stored) throw new PlatformError('user_not_found', 'Platform user not found');
  if (stored.role === 'super_user') {
    throw new PlatformError('forbidden', 'Cannot delete a platform super-user');
  }

  const removed = await deletePlatformUserRow(userId);
  if (!removed) throw new PlatformError('user_not_found', 'Platform user not found');
}

export async function updatePlatformUserPassword(
  userId: string,
  passwordHash: string,
): Promise<StoredPlatformUser> {
  const existing = await findPlatformUserRowById(userId);
  if (!existing) throw new PlatformError('user_not_found', 'Platform user not found');
  const updated = await updatePlatformUserRow(userId, {
    passwordHash,
    sessionVersion: existing.sessionVersion + 1,
  });
  if (!updated) throw new PlatformError('user_not_found', 'Platform user not found');
  return updated;
}

export async function findPlatformUserByEmail(email: string): Promise<StoredPlatformUser | null> {
  return findPlatformUserRowByEmail(email);
}

export async function getStoredPlatformUserById(id: string): Promise<StoredPlatformUser | null> {
  return findPlatformUserRowById(id);
}

export async function updatePlatformUserName(
  userId: string,
  name: string,
): Promise<StoredPlatformUser> {
  const updated = await updatePlatformUserRow(userId, { name: name.trim() });
  if (!updated) throw new PlatformError('user_not_found', 'Platform user not found');
  return updated;
}

/** Verifies the platform super-user password without changing credentials. */
export async function verifyPlatformUserPassword(userId: string, password: string): Promise<boolean> {
  const stored = await findPlatformUserRowById(userId);
  if (!stored) return false;
  return verifyPassword(password, stored.passwordHash);
}

export function toPublicPlatformUser(user: StoredPlatformUser): PlatformUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
  };
}

/**
 * Optional dev bootstrap from env when PLATFORM_ALLOW_ENV_BOOTSTRAP=true.
 * Requires explicit PLATFORM_ADMIN_EMAIL + PLATFORM_ADMIN_PASSWORD (or SEED_DEV_PASSWORD).
 */
export async function ensurePlatformSuperUserFromEnv(): Promise<void> {
  if (process.env.PLATFORM_ALLOW_ENV_BOOTSTRAP !== 'true') return;

  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  const password =
    process.env.PLATFORM_ADMIN_PASSWORD?.trim() ?? process.env.SEED_DEV_PASSWORD?.trim();
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Platform Admin';

  if (!email || !password) {
    console.warn(
      '[MMS] PLATFORM_ALLOW_ENV_BOOTSTRAP=true but credentials missing — skipping bootstrap',
    );
    return;
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await findPlatformUserRowByEmail(normalizedEmail);

  if (existing) {
    const matches = await verifyPassword(password, existing.passwordHash);
    if (!matches) {
      const newHash = await hashPassword(password);
      await updatePlatformUserRow(existing.id, {
        passwordHash: newHash,
        name: name || existing.name,
      });
      console.log(`[MMS] Updated platform super-user password from env for ${existing.email}`);
    }
    return;
  }

  if ((await countPlatformUserRows()) === 0) {
    const user: StoredPlatformUser = {
      id: randomBytes(8).toString('hex'),
      email: normalizedEmail,
      name,
      passwordHash: await hashPassword(password),
      role: 'super_user',
      permissions: FULL_PLATFORM_ADMIN_PERMISSIONS,
      sessionVersion: 0,
      createdAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
    };
    await insertPlatformUser(user);
    console.log(`Platform super-user seeded from env for ${user.email}`);
  }
}

