import { randomBytes } from 'node:crypto';
import {
  type WorkspaceUser,
  type ActivityLog,
  type Contact,
  type UsersListQuery,
  type UsersListPageResult,
  type CreateWorkspaceUserInput,
  type EditWorkspaceUserInput,
  type InviteWorkspaceUserInput,
  normalizeWorkspaceUser,
  workspaceUserListSchema,
  activityLogListSchema,
  canAssignRole,
  canManageTargetUser,
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  todayISO,
  computeUserInitials,
} from '@mms/shared';
import { getHydratedUsers, saveUsers } from './auth/userService.js';
import { getRawUsers, type PersistedUser } from './auth/userServiceShared.js';
import {
  listActivityLogsByWorkspace,
  bulkSaveActivityLogs,
  replaceActivityLogsForWorkspace,
} from '../db/repositories/logsRepository.js';
import {
  softDeleteTenantUserRow,
  restoreTenantUserRow,
  verifyTenantUserEmailRow,
  resetTenantUserPasswordRow,
  findTenantUserRowById,
  listTenantUsersByIds,
} from '../db/repositories/tenantUserRepository.js';
import {
  aggregateUsersCommandMetrics,
  countTenantUsersActive,
  listTenantUsersPage,
} from '../db/repositories/tenantUserRepositoryList.js';
import { deleteRefreshTokensForUser } from './auth/authArtifactService.js';
import { hashPassword } from './auth/passwordService.js';
import { assertPasswordMeetsPolicy } from './globalSettingsService.js';
import { revokeAllUserSessions } from './session.service.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';
import type { ContactLike } from '@mms/shared';
import { hydrateWorkspaceUserProfile } from '@mms/shared';
import { loadContactsByIds } from './contactService.js';

async function hydrateUserRows(rows: Awaited<ReturnType<typeof listTenantUsersByIds>>): Promise<WorkspaceUser[]> {
  const contactIds = [
    ...new Set(
      rows
        .map((row) => row.contactId)
        .filter((id): id is string | number => id != null && id !== '')
        .map(String),
    ),
  ];
  const contacts =
    contactIds.length > 0 ? (await loadContactsByIds(contactIds)) as ContactLike[] : [];
  return rows.map((row) =>
    normalizeWorkspaceUser(
      hydrateWorkspaceUserProfile(row, contacts) as Partial<WorkspaceUser>,
    ),
  );
}

export async function loadUsersPage(
  query: UsersListQuery & { includeDeleted?: boolean },
): Promise<UsersListPageResult> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { users: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
  }
  const page = await listTenantUsersPage(tenant, query);
  const ids = page.rows.map((row) => String(row.id));
  const rows = ids.length > 0 ? await listTenantUsersByIds(ids) : [];
  const byId = new Map(rows.map((row) => [String(row.id), row]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as typeof rows;
  const users = await hydrateUserRows(ordered);
  return {
    users,
    total: page.total,
    page: page.page,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export async function loadUsersByIds(ids: string[]): Promise<WorkspaceUser[]> {
  const uniqueIds = [...new Set(ids.map(String).filter(Boolean))];
  if (uniqueIds.length === 0) return [];
  const rows = await listTenantUsersByIds(uniqueIds);
  return hydrateUserRows(rows);
}

export async function countUsers(): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  return countTenantUsersActive(tenant);
}

export async function loadUsersCommandMetrics() {
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      total: 0,
      active: 0,
      suspended: 0,
      admins: 0,
      twoFaEnabled: 0,
      activeSessions: 0,
    };
  }
  return aggregateUsersCommandMetrics(tenant);
}

// --- Users ---
export async function loadWorkspaceUsers(options?: {
  includeDeleted?: boolean;
}): Promise<WorkspaceUser[]> {
  const users = await getHydratedUsers({ includeDeleted: options?.includeDeleted });
  return users.map((u) => normalizeWorkspaceUser(u));
}

export async function upsertWorkspaceUsers(
  records: WorkspaceUser[],
  actorRole?: string,
): Promise<WorkspaceUser[]> {
  const parsed = workspaceUserListSchema.parse(records);
  const existing = await getHydratedUsers();

  const existingById = new Map(existing.map((u) => [String(u.id), u] as const));
  const updatesById = new Map(parsed.map((u) => [String(u.id), u] as const));

  if (actorRole) {
    for (const update of parsed) {
      const existingUser = existingById.get(String(update.id));
      if (existingUser && !canManageTargetUser(actorRole, existingUser.role)) {
        const err = new Error('Cannot modify a Super Admin user account') as Error & {
          statusCode?: number;
          type?: string;
        };
        err.statusCode = 403;
        err.type = 'forbidden_super_admin_mutation';
        throw err;
      }
      if (update.role && !canAssignRole(actorRole, update.role)) {
        const err = new Error('Only Super Admin can assign the Super Admin role') as Error & {
          statusCode?: number;
          type?: string;
        };
        err.statusCode = 403;
        err.type = 'forbidden_super_admin_assignment';
        throw err;
      }
    }
  }

  // Merge by id to avoid wipe-risk when the client sends partial updates.
  // Soft-deleted rows are excluded from getHydratedUsers and stay untouched.
  const merged = existing.map((u) => updatesById.get(String(u.id)) ?? u);
  for (const update of parsed) {
    if (!existingById.has(String(update.id))) {
      merged.push(update as unknown as (typeof existing)[number]);
    }
  }

  await saveUsers(merged as unknown as Parameters<typeof saveUsers>[0]);
  await broadcastCollection('users');
  return loadWorkspaceUsers();
}

export async function createWorkspaceUser(
  input: (CreateWorkspaceUserInput | WorkspaceUser) & Record<string, unknown>,
  actorId: string,
  actorRole?: string,
  ip = '127.0.0.1',
): Promise<WorkspaceUser> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');

  if (actorRole && !canAssignRole(actorRole, input.role)) {
    const err = new Error('Only Super Admin can assign the Super Admin role') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 403;
    err.type = 'forbidden_super_admin_assignment';
    throw err;
  }

  let name = String(input.name || '').trim();
  let email = String(input.email || '').trim().toLowerCase();
  let phone = String(input.phone || '').trim();
  const contactId = input.contactId;

  if (contactId != null && contactId !== '') {
    const contacts = (await loadContactsByIds([String(contactId)])) as ContactLike[];
    if (contacts.length > 0) {
      const c = contacts[0] as unknown as Contact;
      name = name || getDisplayName(c);
      email = email || (getPrimaryEmail(c) || '').toLowerCase();
      phone = phone || getPrimaryPhone(c) || '';
    }
  }

  if (!email) {
    const err = new Error('User email is required') as Error & { statusCode?: number; type?: string };
    err.statusCode = 400;
    err.type = 'validation_error';
    throw err;
  }

  const existing = await getHydratedUsers();
  if (existing.some((u) => u.loginEmail?.toLowerCase() === email || u.email?.toLowerCase() === email)) {
    const err = new Error(`User with email "${email}" already exists`) as Error & { statusCode?: number; type?: string };
    err.statusCode = 400;
    err.type = 'duplicate_user_email';
    throw err;
  }

  let passwordHash = '';
  let mustChangePassword = false;
  const setupMethod = (input as { setupMethod?: string }).setupMethod;
  const password = (input as { password?: string }).password;
  const forceReset = (input as { forceReset?: boolean }).forceReset;

  if (setupMethod === 'password' && password) {
    await assertPasswordMeetsPolicy(password);
    passwordHash = await hashPassword(password);
    mustChangePassword = forceReset !== false;
  }

  const userId = 'id' in input && input.id ? String(input.id) : randomBytes(8).toString('hex');
  const userRecord: PersistedUser = {
    id: userId,
    contactId: contactId != null ? String(contactId) : undefined,
    name: name || email,
    email,
    loginEmail: email,
    phone,
    role: input.role,
    status: setupMethod === 'invite' ? 'inactive' : (input.status ?? 'active'),
    twoFactorEnabled: input.twoFactorEnabled ?? false,
    lastLogin: '',
    createdDate: todayISO(),
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
    activeSessions: 0,
    avatarInitials: computeUserInitials(name || email),
    passwordHash,
    mustChangePassword,
    workspaceSubdomain: tenant,
  };

  const users = await getRawUsers();
  users.push(userRecord);
  await saveUsers(users);
  await broadcastCollection('users');

  // Record transactional server activity log
  const log: ActivityLog = {
    id: `log_${randomBytes(8).toString('hex')}`,
    userId: actorId,
    action: 'create',
    module: 'users',
    detail: `Created user ${name} (${email}) with role ${input.role}`,
    ts: new Date().toISOString(),
    ip,
  };
  await bulkSaveActivityLogs(tenant, [log]);
  await broadcastCollection('user_activity_logs');

  const reloaded = await loadWorkspaceUsers();
  const created = reloaded.find((u) => String(u.id) === userId);
  return created ?? normalizeWorkspaceUser(userRecord);
}

export async function updateWorkspaceUser(
  id: string,
  input: Partial<EditWorkspaceUserInput> & Record<string, unknown>,
  actorId: string,
  actorRole?: string,
  ip = '127.0.0.1',
): Promise<WorkspaceUser> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');

  const existingRow = await findTenantUserRowById(id);
  if (!existingRow || existingRow.deletedAt) {
    const err = new Error('User not found') as Error & { statusCode?: number; type?: string };
    err.statusCode = 404;
    err.type = 'not_found';
    throw err;
  }

  if (actorRole && !canManageTargetUser(actorRole, existingRow.role)) {
    const err = new Error('Cannot modify a Super Admin user account') as Error & { statusCode?: number; type?: string };
    err.statusCode = 403;
    err.type = 'forbidden_super_admin_mutation';
    throw err;
  }

  if (input.role && actorRole && !canAssignRole(actorRole, input.role)) {
    const err = new Error('Only Super Admin can assign the Super Admin role') as Error & { statusCode?: number; type?: string };
    err.statusCode = 403;
    err.type = 'forbidden_super_admin_assignment';
    throw err;
  }

  const rawUsers = await getRawUsers();
  const target = rawUsers.find((u) => String(u.id) === id);
  if (!target) {
    const err = new Error('User not found') as Error & { statusCode?: number; type?: string };
    err.statusCode = 404;
    err.type = 'not_found';
    throw err;
  }

  if (input.contactId !== undefined) {
    target.contactId = input.contactId != null && input.contactId !== '' ? String(input.contactId) : undefined;
  }
  if (input.role !== undefined) target.role = input.role;
  if (input.status !== undefined) target.status = input.status;
  if (input.twoFactorEnabled !== undefined) target.twoFactorEnabled = input.twoFactorEnabled;

  // Preserve any custom fields
  for (const [k, v] of Object.entries(input)) {
    if (!['contactId', 'role', 'status', 'twoFactorEnabled'].includes(k)) {
      (target as Record<string, unknown>)[k] = v;
    }
  }

  await saveUsers(rawUsers);
  await broadcastCollection('users');

  // Record transactional server activity log
  const log: ActivityLog = {
    id: `log_${randomBytes(8).toString('hex')}`,
    userId: actorId,
    action: 'update',
    module: 'users',
    detail: `Updated user ${target.name || id}`,
    ts: new Date().toISOString(),
    ip,
  };
  await bulkSaveActivityLogs(tenant, [log]);
  await broadcastCollection('user_activity_logs');

  const reloaded = await loadWorkspaceUsers();
  const updated = reloaded.find((u) => String(u.id) === id);
  return updated ?? normalizeWorkspaceUser(target);
}

export async function inviteWorkspaceUser(
  input: InviteWorkspaceUserInput,
  actorId: string,
  actorRole?: string,
  ip = '127.0.0.1',
): Promise<WorkspaceUser> {
  return createWorkspaceUser(
    {
      ...input,
      status: input.status ?? 'inactive',
      setupMethod: 'invite',
      twoFactorEnabled: false,
    },
    actorId,
    actorRole,
    ip,
  );
}

export async function deleteUserById(
  id: string,
  deletedBy: string,
  actorRole?: string,
  ip = '127.0.0.1',
): Promise<boolean> {
  if (id === deletedBy) {
    const err = new Error('Cannot delete your own account') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 400;
    err.type = 'self_delete';
    throw err;
  }

  const existing = await findTenantUserRowById(id);
  if (!existing || existing.deletedAt) return false;

  if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
    const err = new Error('Cannot delete a Super Admin user account') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 403;
    err.type = 'forbidden_super_admin_deletion';
    throw err;
  }

  const ok = await softDeleteTenantUserRow(id, deletedBy);
  if (ok) {
    await deleteRefreshTokensForUser(id);
    await broadcastCollection('users');

    const tenant = getRequestTenant();
    if (tenant) {
      const log: ActivityLog = {
        id: `log_${randomBytes(8).toString('hex')}`,
        userId: deletedBy,
        action: 'delete',
        module: 'users',
        detail: `Deleted user ${existing.name || id}`,
        ts: new Date().toISOString(),
        ip,
      };
      await bulkSaveActivityLogs(tenant, [log]);
      await broadcastCollection('user_activity_logs');
    }
  }
  return ok;
}

export async function restoreUserById(
  id: string,
  actorRole?: string,
  actorId = 'system',
  ip = '127.0.0.1',
): Promise<boolean> {
  const existing = await findTenantUserRowById(id);
  if (!existing) return false;

  if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
    const err = new Error('Cannot restore a Super Admin user account') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 403;
    err.type = 'forbidden_super_admin_mutation';
    throw err;
  }

  const ok = await restoreTenantUserRow(id);
  if (ok) {
    await broadcastCollection('users');

    const tenant = getRequestTenant();
    if (tenant) {
      const log: ActivityLog = {
        id: `log_${randomBytes(8).toString('hex')}`,
        userId: actorId,
        action: 'update',
        module: 'users',
        detail: `Restored user ${existing.name || id}`,
        ts: new Date().toISOString(),
        ip,
      };
      await bulkSaveActivityLogs(tenant, [log]);
      await broadcastCollection('user_activity_logs');
    }
  }
  return ok;
}

export async function verifyUserEmailById(id: string, actorRole?: string): Promise<boolean> {
  const existing = await findTenantUserRowById(id);
  if (!existing) return false;

  if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
    const err = new Error('Cannot modify a Super Admin user account') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 403;
    err.type = 'forbidden_super_admin_mutation';
    throw err;
  }

  const ok = await verifyTenantUserEmailRow(id);
  if (ok) await broadcastCollection('users');
  return ok;
}

export async function resetUserPasswordById(
  id: string,
  temporaryPassword: string,
  actorRole?: string,
  actorId = 'system',
  ip = '127.0.0.1',
): Promise<boolean> {
  const existing = await findTenantUserRowById(id);
  if (!existing || existing.deletedAt) return false;

  if (actorRole && !canManageTargetUser(actorRole, existing.role)) {
    const err = new Error('Cannot reset password of a Super Admin user account') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 403;
    err.type = 'forbidden_super_admin_mutation';
    throw err;
  }

  await assertPasswordMeetsPolicy(temporaryPassword);
  const passwordHash = await hashPassword(temporaryPassword);
  const updated = await resetTenantUserPasswordRow(id, passwordHash);
  if (!updated) return false;

  await deleteRefreshTokensForUser(id);
  await revokeAllUserSessions(id);
  await broadcastCollection('users');

  const tenant = getRequestTenant();
  if (tenant) {
    const log: ActivityLog = {
      id: `log_${randomBytes(8).toString('hex')}`,
      userId: actorId,
      action: 'update',
      module: 'users',
      detail: `Reset password for user ${existing.name || id}`,
      ts: new Date().toISOString(),
      ip,
    };
    await bulkSaveActivityLogs(tenant, [log]);
    await broadcastCollection('user_activity_logs');
  }
  return true;
}

export async function bulkSoftDeleteUsers(
  ids: string[],
  deletedBy: string,
  actorRole?: string,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      const ok = await deleteUserById(id, deletedBy, actorRole);
      if (ok) succeeded += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  return { succeeded, failed };
}

export async function bulkRestoreUsers(
  ids: string[],
  actorRole?: string,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      const ok = await restoreUserById(id, actorRole);
      if (ok) succeeded += 1;
      else failed += 1;
    } catch {
      failed += 1;
    }
  }
  return { succeeded, failed };
}

// --- Activity Logs ---
const logService = defineTenantBulkCollectionService<ActivityLog>(
  { listByWorkspace: listActivityLogsByWorkspace, replaceForWorkspace: replaceActivityLogsForWorkspace },
  activityLogListSchema,
  'user_activity_logs',
);
export const loadLogs = logService.load;

/** Upserts supplied activity logs without removing unrelated rows. */
export async function upsertLogs(records: ActivityLog[]): Promise<ActivityLog[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = activityLogListSchema.parse(records);
  await bulkSaveActivityLogs(tenant, parsed);
  await broadcastCollection('user_activity_logs');
  return parsed;
}
