import { randomBytes } from 'node:crypto';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type StoredTenantUser, resolveTenantLoginEmail, applyTitleCaseRecursive } from '@mms/shared';
import { withTenant } from '../tenant-context.js';
import { tenantUsers } from '../schema.js';

export type TenantUserRow = StoredTenantUser & Record<string, unknown>;

const TABLE_AUTH_KEYS = new Set([
  'id',
  'workspaceSubdomain',
  'loginEmail',
  'passwordHash',
  'name',
  'role',
  'contactId',
  'emailVerifiedAt',
  'pendingLoginEmail',
  'createdAt',
  'email',
  'mustChangePassword',
  'deletedAt',
  'deletedBy',
]);

function splitProfileFields(user: TenantUserRow): {
  columns: typeof tenantUsers.$inferInsert;
  profile: Record<string, unknown>;
} {
  const profile: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(user)) {
    if (!TABLE_AUTH_KEYS.has(key) && value !== undefined) {
      profile[key] = value;
    }
  }

  const loginEmail = resolveTenantLoginEmail(user, typeof user.email === 'string' ? user.email : undefined);
  const workspaceSubdomain =
    typeof user.workspaceSubdomain === 'string' ? user.workspaceSubdomain.trim().toLowerCase() : '';

  return {
    columns: {
      id: String(user.id),
      workspaceSubdomain,
      loginEmail,
      passwordHash: typeof user.passwordHash === 'string' ? user.passwordHash : '',
      name: typeof user.name === 'string' ? user.name : '',
      role: typeof user.role === 'string' ? user.role : 'assistant_teacher',
      contactId: user.contactId != null && user.contactId !== '' ? String(user.contactId) : null,
      emailVerifiedAt:
        typeof user.emailVerifiedAt === 'string' ? new Date(user.emailVerifiedAt) : null,
      pendingLoginEmail:
        typeof user.pendingLoginEmail === 'string' ? user.pendingLoginEmail.toLowerCase() : null,
      createdAt:
        typeof user.createdAt === 'string' ? new Date(user.createdAt) : new Date(),
      mustChangePassword: user.mustChangePassword === true,
      deletedAt:
        typeof user.deletedAt === 'string' && user.deletedAt
          ? new Date(user.deletedAt)
          : user.deletedAt === null
            ? null
            : undefined,
      deletedBy:
        typeof user.deletedBy === 'string' && user.deletedBy
          ? user.deletedBy
          : user.deletedBy === null
            ? null
            : undefined,
      profileJson: Object.keys(profile).length > 0 ? profile : null,
    },
    profile,
  };
}

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

export async function replaceTenantUsersForWorkspace(
  workspaceSubdomain: string,
  users: TenantUserRow[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  // Backup payloads never carry password hashes, so keep the current credential
  // for any account the payload still contains — a restore must not lock admins out.
  const existingRows = await listAllTenantUsersByWorkspace(subdomain);
  const hashById = new Map<string, string>();
  const hashByLoginEmail = new Map<string, string>();
  for (const row of existingRows) {
    const hash = typeof row.passwordHash === 'string' ? row.passwordHash : '';
    if (!hash) continue;
    hashById.set(String(row.id), hash);
    if (row.loginEmail) hashByLoginEmail.set(row.loginEmail.trim().toLowerCase(), hash);
  }

  let parkedAnyCredential = false;
  let adminCredentialSurvives = false;
  const values = users.map((user) => {
    const { columns } = splitProfileFields({ ...user, workspaceSubdomain: subdomain });
    if (!columns.passwordHash) {
      columns.passwordHash =
        hashById.get(columns.id) ??
        hashByLoginEmail.get(columns.loginEmail.trim().toLowerCase()) ??
        '';
    }

    if (columns.passwordHash) {
      if (columns.role === 'admin' && !columns.deletedAt) adminCredentialSurvives = true;
      return columns;
    }

    // Accounts present in the backup but absent from this workspace have no recoverable
    // credential. Park an unverifiable hash and force a reset instead of failing the
    // whole restore. The value carries no `salt:hash` separator, so `verifyPassword`
    // rejects every candidate password until an admin resets it.
    columns.passwordHash = `!restore-${randomBytes(32).toString('base64url')}`;
    columns.mustChangePassword = true;
    parkedAnyCredential = true;
    return columns;
  });

  // Parking credentials is only safe while at least one live admin can still sign in.
  if (parkedAnyCredential && !adminCredentialSurvives) {
    const err = new Error('backup.missingUserCredentials') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 400;
    err.type = 'validation_error';
    throw err;
  }

  await withTenant(subdomain, async (tx) => {
    await tx.delete(tenantUsers).where(eq(tenantUsers.workspaceSubdomain, subdomain));

    if (values.length === 0) return;

    await tx.insert(tenantUsers).values(values);
  });
}

function omitUndefinedColumns<T extends Record<string, unknown>>(columns: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(columns).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function nonEmptyString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : '';
}

function tenantUserIdWhere(id: string, workspaceSubdomain: string) {
  return and(
    eq(tenantUsers.id, id),
    eq(tenantUsers.workspaceSubdomain, workspaceSubdomain.trim().toLowerCase()),
  );
}

export async function upsertTenantUserRow(user: TenantUserRow): Promise<void> {
  const processedUser = applyTitleCaseRecursive(user) as TenantUserRow;
  const { columns } = splitProfileFields(processedUser);
  const existing = await findTenantUserRowById(columns.id);

  if (existing) {
    const existingWorkspace =
      typeof existing.workspaceSubdomain === 'string' ? existing.workspaceSubdomain : '';
    // Contact-linked clients may strip profile fields; never blank auth credentials.
    // Keep workspace bound to the existing row (no cross-tenant reassignment).
    const merged = {
      ...omitUndefinedColumns(columns),
      workspaceSubdomain: existingWorkspace,
      name: nonEmptyString(columns.name) || existing.name || '',
      loginEmail: nonEmptyString(columns.loginEmail) || existing.loginEmail || '',
      passwordHash: nonEmptyString(columns.passwordHash) || existing.passwordHash || '',
      updatedAt: new Date(),
    };
    await withTenant(existingWorkspace, async (tx) => {
      await tx.update(tenantUsers).set(merged).where(tenantUserIdWhere(columns.id, existingWorkspace));
    });
    return;
  }

  await withTenant(columns.workspaceSubdomain, async (tx) => {
    await tx.insert(tenantUsers).values(omitUndefinedColumns(columns) as typeof columns);
  });
}

export async function softDeleteTenantUserRow(
  id: string,
  deletedBy: string,
): Promise<boolean> {
  const existing = await findTenantUserRowById(id);
  if (!existing || existing.deletedAt) return false;
  const workspaceSubdomain =
    typeof existing.workspaceSubdomain === 'string' ? existing.workspaceSubdomain : '';
  await withTenant(workspaceSubdomain, async (tx) => {
    await tx
      .update(tenantUsers)
      .set({
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      })
      .where(tenantUserIdWhere(id, workspaceSubdomain));
  });
  return true;
}

export async function restoreTenantUserRow(id: string): Promise<boolean> {
  const existing = await findTenantUserRowById(id);
  if (!existing || !existing.deletedAt) return false;
  const workspaceSubdomain =
    typeof existing.workspaceSubdomain === 'string' ? existing.workspaceSubdomain : '';
  await withTenant(workspaceSubdomain, async (tx) => {
    await tx
      .update(tenantUsers)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
      })
      .where(tenantUserIdWhere(id, workspaceSubdomain));
  });
  return true;
}
