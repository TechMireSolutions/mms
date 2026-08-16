import { asc, count, eq } from 'drizzle-orm';
import {
  type StoredPlatformUser,
  type PlatformRole,
  type PlatformAdminPermissions,
  type PlatformAdminPermissionKey,
  applyTitleCaseRecursive,
  normalizePlatformAdminPermissions,
  FULL_PLATFORM_ADMIN_PERMISSIONS,
} from '@mms/shared';
import { getDb } from '../dbClient.js';
import { platformUsers, platformUserPermissions } from '../schema.js';

// ---------------------------------------------------------------------------
// Internal: Hydrate permissions from child table rows
// ---------------------------------------------------------------------------

const PERMISSION_KEYS: PlatformAdminPermissionKey[] = ['workspaces', 'onboard'];

async function loadPermissions(userId: string): Promise<PlatformAdminPermissions> {
  const rows = await getDb()
    .select({ permissionKey: platformUserPermissions.permissionKey, isGranted: platformUserPermissions.isGranted })
    .from(platformUserPermissions)
    .where(eq(platformUserPermissions.platformUserId, userId));

  const perms: Record<string, boolean> = {};
  for (const row of rows) {
    perms[row.permissionKey] = row.isGranted;
  }
  return normalizePlatformAdminPermissions(perms);
}

async function writePermissions(userId: string, permissions: PlatformAdminPermissions): Promise<void> {
  // Delete existing then insert — simple and correct for ≤10 keys.
  await getDb().delete(platformUserPermissions).where(eq(platformUserPermissions.platformUserId, userId));

  const rows = PERMISSION_KEYS.map((key) => ({
    platformUserId: userId,
    permissionKey: key,
    isGranted: Boolean(permissions[key]),
  }));
  if (rows.length > 0) {
    await getDb().insert(platformUserPermissions).values(rows);
  }
}

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function rowToStored(
  row: typeof platformUsers.$inferSelect,
  permissions: PlatformAdminPermissions,
): StoredPlatformUser {
  const role = row.role as PlatformRole;
  const effectivePerms =
    role === 'super_user' ? FULL_PLATFORM_ADMIN_PERMISSIONS : permissions;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    role,
    permissions: effectivePerms,
    sessionVersion: row.sessionVersion ?? 0,
    createdAt: row.createdAt.toISOString(),
    emailVerifiedAt: row.emailVerifiedAt?.toISOString(),
    disabledAt: row.disabledAt?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function countPlatformUserRows(): Promise<number> {
  const rows = await getDb().select({ value: count() }).from(platformUsers);
  return Number(rows[0]?.value ?? 0);
}

export async function listPlatformUsers(): Promise<StoredPlatformUser[]> {
  const rows = await getDb().select().from(platformUsers).orderBy(asc(platformUsers.createdAt));
  return Promise.all(
    rows.map(async (row) => {
      const perms = await loadPermissions(row.id);
      return rowToStored(row, perms);
    }),
  );
}

export async function findPlatformUserRowByEmail(email: string): Promise<StoredPlatformUser | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(platformUsers)
    .where(eq(platformUsers.email, normalized));
  const row = rows[0];
  if (!row) return null;
  const perms = await loadPermissions(row.id);
  return rowToStored(row, perms);
}

export async function findPlatformUserRowById(id: string): Promise<StoredPlatformUser | null> {
  const rows = await getDb().select().from(platformUsers).where(eq(platformUsers.id, id));
  const row = rows[0];
  if (!row) return null;
  const perms = await loadPermissions(row.id);
  return rowToStored(row, perms);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

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
    sessionVersion: processedUser.sessionVersion ?? 0,
    emailVerifiedAt: processedUser.emailVerifiedAt ? new Date(processedUser.emailVerifiedAt) : null,
    disabledAt: processedUser.disabledAt ? new Date(processedUser.disabledAt) : null,
    createdAt: new Date(processedUser.createdAt),
  });

  await writePermissions(processedUser.id, permissions);
}

export async function updatePlatformUserRow(
  userId: string,
  patch: Partial<
    Pick<
      StoredPlatformUser,
      | 'email'
      | 'name'
      | 'passwordHash'
      | 'emailVerifiedAt'
      | 'role'
      | 'permissions'
      | 'sessionVersion'
      | 'disabledAt'
    >
  >,
): Promise<StoredPlatformUser | null> {
  const existing = await findPlatformUserRowById(userId);
  if (!existing) return null;

  const processedPatch = applyTitleCaseRecursive(patch) as typeof patch;
  const next: StoredPlatformUser = {
    ...existing,
    ...processedPatch,
    email: processedPatch.email ? processedPatch.email.toLowerCase() : existing.email,
    permissions:
      processedPatch.permissions !== undefined
        ? normalizePlatformAdminPermissions(processedPatch.permissions)
        : existing.permissions,
    sessionVersion: processedPatch.sessionVersion ?? existing.sessionVersion,
    disabledAt:
      processedPatch.disabledAt !== undefined ? processedPatch.disabledAt : existing.disabledAt,
  };

  if (next.role === 'super_user') {
    next.permissions = FULL_PLATFORM_ADMIN_PERMISSIONS;
  }

  await getDb()
    .update(platformUsers)
    .set({
      email: next.email,
      name: next.name,
      passwordHash: next.passwordHash,
      role: next.role,
      sessionVersion: next.sessionVersion,
      emailVerifiedAt: next.emailVerifiedAt ? new Date(next.emailVerifiedAt) : null,
      disabledAt: next.disabledAt ? new Date(next.disabledAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(platformUsers.id, userId));

  // Write permissions to child table if they changed.
  if (processedPatch.permissions !== undefined || processedPatch.role !== undefined) {
    await writePermissions(userId, next.permissions);
  }

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

export async function deletePlatformUserRow(userId: string): Promise<boolean> {
  const existing = await findPlatformUserRowById(userId);
  if (!existing) return false;
  // Child rows cascade-deleted by FK constraint.
  await getDb().delete(platformUsers).where(eq(platformUsers.id, userId));
  return true;
}
