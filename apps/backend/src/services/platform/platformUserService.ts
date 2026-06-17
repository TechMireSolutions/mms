import { randomBytes } from 'node:crypto';
import type { PlatformUser, StoredPlatformUser } from '@mms/shared';
import { PLATFORM_SUPER_USERS_OBJECT_KEY } from '@mms/shared';
import { getObject, saveObject } from '../../db/database.js';
import { hashPassword, verifyPassword } from '../auth/passwordService.js';

async function loadStoredUsers(): Promise<StoredPlatformUser[]> {
  const raw = await getObject(PLATFORM_SUPER_USERS_OBJECT_KEY);
  if (!raw || !Array.isArray(raw)) return [];
  return raw as StoredPlatformUser[];
}

async function persistUsers(users: StoredPlatformUser[]): Promise<void> {
  await saveObject(PLATFORM_SUPER_USERS_OBJECT_KEY, users);
}

export async function countPlatformUsers(): Promise<number> {
  const users = await loadStoredUsers();
  return users.length;
}

export async function hasPlatformUsers(): Promise<boolean> {
  return (await countPlatformUsers()) > 0;
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
  await persistUsers([user]);
  return user;
}

export async function updatePlatformUserPassword(
  userId: string,
  passwordHash: string,
): Promise<StoredPlatformUser> {
  const users = await loadStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) {
    throw new Error('Platform user not found');
  }

  const updated: StoredPlatformUser = {
    ...users[index],
    passwordHash,
  };
  users[index] = updated;
  await persistUsers(users);
  return updated;
}

export async function findPlatformUserByEmail(email: string): Promise<StoredPlatformUser | null> {
  const normalized = email.trim().toLowerCase();
  const users = await loadStoredUsers();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function getStoredPlatformUserById(id: string): Promise<StoredPlatformUser | null> {
  const users = await loadStoredUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function updatePlatformUserName(
  userId: string,
  name: string,
): Promise<StoredPlatformUser> {
  const users = await loadStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) {
    throw new Error('Platform user not found');
  }

  const updated: StoredPlatformUser = {
    ...users[index],
    name: name.trim(),
  };
  users[index] = updated;
  await persistUsers(users);
  return updated;
}

export async function changePlatformUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<StoredPlatformUser> {
  const users = await loadStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index < 0) {
    throw new Error('Platform user not found');
  }

  const stored = users[index];
  const ok = await verifyPassword(currentPassword, stored.passwordHash);
  if (!ok) {
    throw new Error('Invalid current password');
  }

  const updated: StoredPlatformUser = {
    ...stored,
    passwordHash: await hashPassword(newPassword),
  };
  users[index] = updated;
  await persistUsers(users);
  return updated;
}

export async function getPublicPlatformUserById(id: string): Promise<PlatformUser | null> {
  const users = await loadStoredUsers();
  const user = users.find((u) => u.id === id);
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
  const existing = await loadStoredUsers();
  if (existing.length > 0) return;

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
  await persistUsers([user]);
  console.log(`Platform super-user seeded from env for ${user.email}`);
}
