import { and, eq, or } from 'drizzle-orm';
import type { StoredPlatformUser } from '@mms/shared';
import { withTenant } from '../../db/tenant-context.js';
import { tenantUsers } from '../../db/schema.js';
import { findPlatformUserRowByRole } from '../../db/repositories/platformUserRepository.js';
import { listWorkspaceRows } from '../../db/repositories/workspaceRepository.js';

/**
 * Resolves the primary active platform super-user record.
 */
export async function findActivePlatformSuperUser(): Promise<StoredPlatformUser | null> {
  try {
    return await findPlatformUserRowByRole('super_user');
  } catch {
    return null;
  }
}

/**
 * Synchronizes the platform super-user into a specific tenant workspace's `tenant_users` table.
 * Grants `role: 'super_admin'`, verified email, active status, un-deleted state, and matching credentials.
 */
export async function syncPlatformSuperUserToTenant(
  workspaceSubdomain: string,
  explicitSuperUser?: StoredPlatformUser | null,
): Promise<boolean> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (!subdomain) return false;

  const superUser =
    explicitSuperUser !== undefined
      ? explicitSuperUser
      : await findActivePlatformSuperUser();

  if (!superUser) return false;

  const normalizedEmail = superUser.email.trim().toLowerCase();
  const superUserId = `pu_${subdomain}_${superUser.id}`;

  return withTenant(subdomain, async (tx) => {
    const existingRows = await tx
      .select()
      .from(tenantUsers)
      .where(
        and(
          eq(tenantUsers.workspaceSubdomain, subdomain),
          or(
            eq(tenantUsers.loginEmail, normalizedEmail),
            eq(tenantUsers.id, superUserId),
          ),
        ),
      );

    const existing = existingRows[0];

    if (existing) {
      await tx
        .update(tenantUsers)
        .set({
          loginEmail: normalizedEmail,
          name: superUser.name || existing.name,
          passwordHash: superUser.passwordHash || existing.passwordHash,
          role: 'super_admin',
          emailVerifiedAt: superUser.emailVerifiedAt
            ? new Date(superUser.emailVerifiedAt)
            : existing.emailVerifiedAt ?? new Date(),
          mustChangePassword: false,
          deletedAt: null,
          deletedBy: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tenantUsers.workspaceSubdomain, subdomain),
            eq(tenantUsers.id, existing.id),
          ),
        );
      return true;
    }

    await tx.insert(tenantUsers).values({
      id: superUserId,
      workspaceSubdomain: subdomain,
      loginEmail: normalizedEmail,
      name: superUser.name,
      passwordHash: superUser.passwordHash,
      role: 'super_admin',
      emailVerifiedAt: superUser.emailVerifiedAt
        ? new Date(superUser.emailVerifiedAt)
        : new Date(),
      mustChangePassword: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedBy: null,
      profileJson: { status: 'active' },
    });

    return true;
  });
}

/**
 * Synchronizes the platform super-user to all active and existing workspaces.
 */
export async function syncPlatformSuperUserToTenants(
  explicitSuperUser?: StoredPlatformUser | null,
): Promise<number> {
  const superUser =
    explicitSuperUser !== undefined
      ? explicitSuperUser
      : await findActivePlatformSuperUser();

  if (!superUser) return 0;

  const workspaces = await listWorkspaceRows();
  let synced = 0;

  for (const ws of workspaces) {
    const ok = await syncPlatformSuperUserToTenant(ws.subdomain, superUser);
    if (ok) synced++;
  }

  return synced;
}
