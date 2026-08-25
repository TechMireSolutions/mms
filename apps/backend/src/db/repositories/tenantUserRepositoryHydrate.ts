import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type StoredTenantUser } from '@mms/shared';
import { withTenant } from '../tenant-context.js';
import { tenantUsers } from '../schema.js';

export type TenantUserRow = StoredTenantUser & Record<string, unknown>;

export function rowToTenantUser(row: typeof tenantUsers.$inferSelect): TenantUserRow {
  const base: TenantUserRow = {
    id: row.id,
    workspaceSubdomain: row.workspaceSubdomain,
    loginEmail: row.loginEmail,
    // Workspace UI reads `email`; auth column is `loginEmail`.
    email: row.loginEmail,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role,
    contactId: row.contactId ?? undefined,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString(),
    pendingLoginEmail: row.pendingLoginEmail ?? undefined,
    createdAt: row.createdAt.toISOString(),
    mustChangePassword: row.mustChangePassword,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedBy: row.deletedBy ?? null,
  };

  if (row.profileJson) {
    const extra = row.profileJson as Record<string, unknown>;
    // Auth/soft-delete columns win over profile_json mirrors.
    return { ...extra, ...base };
  }

  return base;
}

export async function listTenantUsersByIds(ids: string[]): Promise<TenantUserRow[]> {
  const uniqueIds = [...new Set(ids.map(String).filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  return withTenant(null, async (tx) => {
    const rows = await tx
      .select()
      .from(tenantUsers)
      .where(inArray(tenantUsers.id, uniqueIds));
    return rows.map(rowToTenantUser);
  });
}

export async function countTenantUsersByWorkspace(workspaceSubdomain: string): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({ count: sql<string>`count(*)` })
      .from(tenantUsers)
      .where(and(eq(tenantUsers.workspaceSubdomain, subdomain), isNull(tenantUsers.deletedAt)));
    return parseInt(rows[0]?.count ?? '0', 10);
  });
}

export async function listTenantUsersByWorkspace(
  workspaceSubdomain: string,
  options?: { includeDeleted?: boolean },
): Promise<TenantUserRow[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const includeDeleted = options?.includeDeleted === true;
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(tenantUsers)
      .where(
        includeDeleted
          ? and(eq(tenantUsers.workspaceSubdomain, subdomain), sql`${tenantUsers.deletedAt} is not null`)
          : and(eq(tenantUsers.workspaceSubdomain, subdomain), isNull(tenantUsers.deletedAt)),
      );
    return rows.map(rowToTenantUser);
  });
}

/** Every workspace row, active and soft-deleted — backup snapshots and restore merges. */
export async function listAllTenantUsersByWorkspace(
  workspaceSubdomain: string,
): Promise<TenantUserRow[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.workspaceSubdomain, subdomain));
    return rows.map(rowToTenantUser);
  });
}

export async function findTenantUserRowById(id: string): Promise<TenantUserRow | null> {
  return withTenant(null, async (tx) => {
    const rows = await tx.select().from(tenantUsers).where(eq(tenantUsers.id, id));
    const row = rows[0];
    return row ? rowToTenantUser(row) : null;
  });
}
