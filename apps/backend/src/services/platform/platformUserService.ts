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

export async function findPlatformUserByEmail(email: string): Promise<StoredPlatformUser | null> {
  const normalized = email.trim().toLowerCase();
  const users = await loadStoredUsers();
  return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
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
 * Seeds the first platform super-user from env when none exist.
 */
export async function ensurePlatformSuperUserFromEnv(): Promise<void> {
  const existing = await loadStoredUsers();
  if (existing.length > 0) return;

  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim();
  const password = process.env.PLATFORM_ADMIN_PASSWORD?.trim()
    ?? process.env.SEED_DEV_PASSWORD?.trim();
  const name = process.env.PLATFORM_ADMIN_NAME?.trim() || 'Platform Admin';

  if (!email || !password) {
    console.warn(
      'No platform super-user configured. Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD in apps/backend/.env',
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
  console.log(`Platform super-user seeded for ${user.email}`);
}
