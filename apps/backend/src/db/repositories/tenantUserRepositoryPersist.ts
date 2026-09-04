import { randomBytes } from 'node:crypto';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { resolveTenantLoginEmail, applyTitleCaseRecursive } from '@mms/shared';
import { withTenant } from '../tenant-context.js';
import { tenantUsers } from '../schema.js';
import {
  findTenantUserRowById,
  listAllTenantUsersByWorkspace,
  type TenantUserRow,
} from './tenantUserRepositoryHydrate.js';

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

function omitUndefinedColumns<T extends Record<string, unknown>>(columns: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in columns) {
    if (Object.prototype.hasOwnProperty.call(columns, key)) {
      const val = columns[key];
      if (val !== undefined) {
        result[key] = val;
      }
    }
  }
  return result;
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

export async function upsertTenantUsersBatch(users: TenantUserRow[]): Promise<void> {
  if (users.length === 0) return;
  const processedUsers = users.map((u) => applyTitleCaseRecursive(u) as TenantUserRow);
  const userIds = processedUsers.map((u) => String(u.id));
  const subdomain = (users[0]?.workspaceSubdomain as string)?.trim().toLowerCase() || '';

  await withTenant(subdomain, async (tx) => {
    const existingRows = await tx
      .select({
        id: tenantUsers.id,
        workspaceSubdomain: tenantUsers.workspaceSubdomain,
        name: tenantUsers.name,
        loginEmail: tenantUsers.loginEmail,
        passwordHash: tenantUsers.passwordHash,
      })
      .from(tenantUsers)
      .where(inArray(tenantUsers.id, userIds));
    const existingById = new Map(existingRows.map((r) => [String(r.id), r]));

    // Build a single consistent value set for every row (new + existing), then
    // upsert in one query. Semantics are identical to the previous per-user
    // insert/update: existing rows keep their workspace and any empty auth
    // fields fall back to the stored values; new rows are inserted.
    const values: Array<typeof tenantUsers.$inferInsert> = processedUsers.map((user) => {
      const { columns } = splitProfileFields(user);
      const existing = existingById.get(columns.id);
      const workspaceSubdomain = existing
        ? typeof existing.workspaceSubdomain === 'string'
          ? existing.workspaceSubdomain
          : subdomain
        : columns.workspaceSubdomain;
      return {
        id: columns.id,
        workspaceSubdomain,
        loginEmail: existing
          ? nonEmptyString(columns.loginEmail) || existing.loginEmail || ''
          : columns.loginEmail,
        passwordHash: existing
          ? nonEmptyString(columns.passwordHash) || existing.passwordHash || ''
          : columns.passwordHash,
        name: existing
          ? nonEmptyString(columns.name) || existing.name || ''
          : columns.name,
        role: columns.role,
        contactId: columns.contactId ?? null,
        emailVerifiedAt: columns.emailVerifiedAt ?? null,
        pendingLoginEmail: columns.pendingLoginEmail ?? null,
        mustChangePassword: columns.mustChangePassword ?? false,
        createdAt: columns.createdAt ?? new Date(),
        updatedAt: new Date(),
        deletedAt: columns.deletedAt ?? null,
        deletedBy: columns.deletedBy ?? null,
        profileJson: columns.profileJson ?? null,
      };
    });

    await tx
      .insert(tenantUsers)
      .values(values)
      .onConflictDoUpdate({
        target: [tenantUsers.workspaceSubdomain, tenantUsers.id],
        set: {
          loginEmail: sql.raw('excluded.login_email'),
          passwordHash: sql.raw('excluded.password_hash'),
          name: sql.raw('excluded.name'),
          role: sql.raw('excluded.role'),
          contactId: sql.raw('excluded.contact_id'),
          emailVerifiedAt: sql.raw('excluded.email_verified_at'),
          pendingLoginEmail: sql.raw('excluded.pending_login_email'),
          mustChangePassword: sql.raw('excluded.must_change_password'),
          updatedAt: sql.raw('excluded.updated_at'),
          deletedAt: sql.raw('excluded.deleted_at'),
          deletedBy: sql.raw('excluded.deleted_by'),
          profileJson: sql.raw('excluded.profile_json'),
        },
      });
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

export async function verifyTenantUserEmailRow(id: string): Promise<boolean> {
  const existing = await findTenantUserRowById(id);
  if (!existing || existing.deletedAt) return false;
  const workspaceSubdomain =
    typeof existing.workspaceSubdomain === 'string' ? existing.workspaceSubdomain : '';
  await withTenant(workspaceSubdomain, async (tx) => {
    await tx
      .update(tenantUsers)
      .set({
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(tenantUserIdWhere(id, workspaceSubdomain));
  });
  return true;
}

/** Replaces an active user's credential and requires a password change at next sign-in. */
export async function resetTenantUserPasswordRow(
  id: string,
  passwordHash: string,
): Promise<boolean> {
  const existing = await findTenantUserRowById(id);
  if (!existing || existing.deletedAt) return false;
  const workspaceSubdomain =
    typeof existing.workspaceSubdomain === 'string' ? existing.workspaceSubdomain : '';
  await withTenant(workspaceSubdomain, async (tx) => {
    await tx
      .update(tenantUsers)
      .set({
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(tenantUserIdWhere(id, workspaceSubdomain));
  });
  return true;
}
