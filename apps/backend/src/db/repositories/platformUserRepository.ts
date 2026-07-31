import { eq } from 'drizzle-orm';
import {
  type StoredPlatformUser,
  type PlatformRole,
  type PlatformAdminPermissions,
  applyTitleCaseRecursive,
  normalizePlatformAdminPermissions,
  FULL_PLATFORM_ADMIN_PERMISSIONS,
} from '@mms/shared';
import { getDb } from '../dbClient.js';
import { platformUsers } from '../schema.js';

function rowToStored(row: typeof platformUsers.$inferSelect): StoredPlatformUser {
  const role = row.role as PlatformRole;
  const permissions =
    role === 'super_user'
      ? FULL_PLATFORM_ADMIN_PERMISSIONS
      : normalizePlatformAdminPermissions(row.permissions);

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    role,
    permissions,
    createdAt: row.createdAt.toISOString(),
    emailVerifiedAt: row.emailVerifiedAt?.toISOString(),
  };
}

export async function countPlatformUserRows(): Promise<number> {
  const rows = await getDb().select({ id: platformUsers.id }).from(platformUsers);
  return rows.length;
}

export async function listPlatformUsers(): Promise<StoredPlatformUser[]> {
  const rows = await getDb().select().from(platformUsers);
  return rows.map(rowToStored);
}

export async function findPlatformUserRowByEmail(email: string): Promise<StoredPlatformUser | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.email, normalized));
  const row = rows[0];
  return row ? rowToStored(row) : null;
}

export async function findPlatformUserRowById(id: string): Promise<StoredPlatformUser | null> {
  const rows = await getDb().select().from(platformUsers).where(eq(platformUsers.id, id));
  const row = rows[0];
  return row ? rowToStored(row) : null;
}

export async function insertPlatformUser(user: StoredPlatformUser): Promise<void> {
  const processedUser = applyTitleCaseRecursive(user) as StoredPlatformUser;
  const permissions =
    processedUser.role === 'super_user'
      ? FULL_PLATFORM_ADMIN_PERMISSIONS
      : normalizePlatformAdminPermissions(processedUser.permissions);

  await getDb().insert(platformUsers).values({
    id: processedUser.id,
    email: processedUser.email.toLowerCase(),
    name: processedUser.name,
    passwordHash: processedUser.passwordHash,
    role: processedUser.role,
    permissions,
    emailVerifiedAt: processedUser.emailVerifiedAt ? new Date(processedUser.emailVerifiedAt) : null,
    createdAt: new Date(processedUser.createdAt),
  });
}

export async function updatePlatformUserRow(
  userId: string,
  patch: Partial<
    Pick<StoredPlatformUser, 'name' | 'passwordHash' | 'emailVerifiedAt' | 'role' | 'permissions'>
  >,
): Promise<StoredPlatformUser | null> {
  const existing = await findPlatformUserRowById(userId);
  if (!existing) return null;

  const processedPatch = applyTitleCaseRecursive(patch) as typeof patch;
  const next: StoredPlatformUser = {
    ...existing,
    ...processedPatch,
    permissions:
      processedPatch.permissions !== undefined
        ? normalizePlatformAdminPermissions(processedPatch.permissions)
        : existing.permissions,
  };

  if (next.role === 'super_user') {
    next.permissions = FULL_PLATFORM_ADMIN_PERMISSIONS;
  }

  await getDb()
    .update(platformUsers)
    .set({
      name: next.name,
      passwordHash: next.passwordHash,
      role: next.role,
      permissions: next.permissions,
      emailVerifiedAt: next.emailVerifiedAt ? new Date(next.emailVerifiedAt) : null,
    })
    .where(eq(platformUsers.id, userId));

  return next;
}

export async function updatePlatformUserPermissions(
  userId: string,
  permissions: PlatformAdminPermissions,
): Promise<StoredPlatformUser | null> {
  return updatePlatformUserRow(userId, {
    permissions: normalizePlatformAdminPermissions(permissions),
  });
}
