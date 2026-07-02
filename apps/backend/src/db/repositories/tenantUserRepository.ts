import { and, eq, sql } from 'drizzle-orm';
import { type StoredTenantUser, resolveTenantLoginEmail, applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';
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
      profileJson: Object.keys(profile).length > 0 ? JSON.stringify(profile) : null,
    },
    profile,
  };
}

function rowToTenantUser(row: typeof tenantUsers.$inferSelect): TenantUserRow {
  const base: TenantUserRow = {
    id: row.id,
    workspaceSubdomain: row.workspaceSubdomain,
    loginEmail: row.loginEmail,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role,
    contactId: row.contactId ?? undefined,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString(),
    pendingLoginEmail: row.pendingLoginEmail ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };

  if (row.profileJson) {
    try {
      const extra = JSON.parse(row.profileJson) as Record<string, unknown>;
      return { ...extra, ...base };
    } catch {
      return base;
    }
  }

  return base;
}

export async function countTenantUsersByWorkspace(workspaceSubdomain: string): Promise<number> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select({ count: sql<string>`count(*)` })
    .from(tenantUsers)
    .where(eq(tenantUsers.workspaceSubdomain, subdomain));
  return parseInt(rows[0]?.count ?? '0', 10);
}

export async function listTenantUsersByWorkspace(workspaceSubdomain: string): Promise<TenantUserRow[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(tenantUsers)
    .where(eq(tenantUsers.workspaceSubdomain, subdomain));
  return rows.map(rowToTenantUser);
}

export async function findTenantUserRowById(id: string): Promise<TenantUserRow | null> {
  const rows = await getDb().select().from(tenantUsers).where(eq(tenantUsers.id, id));
  const row = rows[0];
  return row ? rowToTenantUser(row) : null;
}

export async function findTenantUserRowByLoginEmail(
  workspaceSubdomain: string,
  loginEmail: string,
): Promise<TenantUserRow | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const email = loginEmail.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(tenantUsers)
    .where(and(eq(tenantUsers.workspaceSubdomain, subdomain), eq(tenantUsers.loginEmail, email)));
  const row = rows[0];
  return row ? rowToTenantUser(row) : null;
}

export async function replaceTenantUsersForWorkspace(
  workspaceSubdomain: string,
  users: TenantUserRow[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db.delete(tenantUsers).where(eq(tenantUsers.workspaceSubdomain, subdomain));

  if (users.length === 0) return;

  await db.insert(tenantUsers).values(
    users.map((user) => {
      const { columns } = splitProfileFields({ ...user, workspaceSubdomain: subdomain });
      return columns;
    }),
  );
}

export async function upsertTenantUserRow(user: TenantUserRow): Promise<void> {
  const processedUser = applyTitleCaseRecursive(user) as TenantUserRow;
  const { columns } = splitProfileFields(processedUser);
  const db = getDb();
  const existing = await findTenantUserRowById(columns.id);

  if (existing) {
    await db
      .update(tenantUsers)
      .set({ ...columns, updatedAt: new Date() })
      .where(eq(tenantUsers.id, columns.id));
    return;
  }

  await db.insert(tenantUsers).values(columns);
}

export async function deleteTenantUsersByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb().delete(tenantUsers).where(eq(tenantUsers.workspaceSubdomain, subdomain));
}
