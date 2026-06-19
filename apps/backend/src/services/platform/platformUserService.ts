import { randomBytes } from 'node:crypto';
import type { PlatformUser, StoredPlatformUser } from '@mms/shared';
import {
  countPlatformUserRows,
  findPlatformUserRowByEmail,
  findPlatformUserRowById,
  insertPlatformUser,
  listPlatformUsers,
  updatePlatformUserRow,
} from '../../db/repositories/platformUserRepository.js';
import { hashPassword, verifyPassword } from '../auth/passwordService.js';

export async function countPlatformUsers(): Promise<number> {
  return countPlatformUserRows();
}

export async function hasPlatformUsers(): Promise<boolean> {
  return (await countPlatformUserRows()) > 0;
}

export async function createVerifiedPlatformUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<StoredPlatformUser> {
  const existing = await findPlatformUserByEmail(input.email);
  if (existing) {
    throw new Error('Platform user already exists');
  }

  const user: StoredPlatformUser = {
    id: randomBytes(8).toString('hex'),
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
    emailVerifiedAt: new Date().toISOString(),
  };
  await insertPlatformUser(user);
  return user;
}

export async function updatePlatformUserPassword(
  userId: string,
  passwordHash: string,
): Promise<StoredPlatformUser> {
  const updated = await updatePlatformUserRow(userId, { passwordHash });
  if (!updated) {
    throw new Error('Platform user not found');
  }
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
  if (!updated) {
    throw new Error('Platform user not found');
  }
  return updated;
}

export async function changePlatformUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<StoredPlatformUser> {
  const stored = await findPlatformUserRowById(userId);
  if (!stored) {
    throw new Error('Platform user not found');
  }

  const ok = await verifyPassword(currentPassword, stored.passwordHash);
  if (!ok) {
    throw new Error('Invalid current password');
  }

  const updated = await updatePlatformUserRow(userId, {
    passwordHash: await hashPassword(newPassword),
  });
  if (!updated) {
    throw new Error('Platform user not found');
  }
  return updated;
}

export async function getPublicPlatformUserById(id: string): Promise<PlatformUser | null> {
  const user = await findPlatformUserRowById(id);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export async function validatePlatformCredentials(
  email: string,
  password: string,
): Promise<PlatformUser | null> {
  const stored = await findPlatformUserByEmail(email);
  if (!stored) return null;
  const ok = await verifyPassword(password, stored.passwordHash);
  if (!ok) return null;
  return { id: stored.id, email: stored.email, name: stored.name };
}

/**
 * Optional dev bootstrap from env when PLATFORM_ALLOW_ENV_BOOTSTRAP=true.
 * Production first-run uses email-verified setup instead.
 */
export async function ensurePlatformSuperUserFromEnv(): Promise<void> {
  if ((await countPlatformUserRows()) > 0) return;

  if (process.env.PLATFORM_ALLOW_ENV_BOOTSTRAP !== 'true') {
    return;
  }

  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.trim()
    ?? process.env.SEED_DEV_PASSWORD?.trim();
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Platform Admin';

  if (!email || !password) {
    console.warn(
      'PLATFORM_ALLOW_ENV_BOOTSTRAP is set but PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD are missing.',
    );
    return;
  }

  const user: StoredPlatformUser = {
    id: randomBytes(8).toString('hex'),
    email: email.toLowerCase(),
    name,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await insertPlatformUser(user);
  console.log(`Platform super-user seeded from env for ${user.email}`);
}

/** Used by data migration — reads legacy object store if present. */
export async function importLegacyPlatformUsers(users: StoredPlatformUser[]): Promise<number> {
  let imported = 0;
  for (const user of users) {
    const existing = await findPlatformUserRowByEmail(user.email);
    if (existing) continue;
    await insertPlatformUser(user);
    imported += 1;
  }
  return imported;
}

/** @internal test helper */
export async function listAllPlatformUsersForMigration(): Promise<StoredPlatformUser[]> {
  return listPlatformUsers();
}
