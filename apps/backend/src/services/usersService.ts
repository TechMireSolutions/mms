import {
  type WorkspaceUser,
  type ActivityLog,
  type UsersListQuery,
  type UsersListPageResult,
  normalizeWorkspaceUser,
  workspaceUserListSchema,
  activityLogListSchema,
} from '@mms/shared';
import { getHydratedUsers, saveUsers } from './auth/userService.js';
import {
  listActivityLogsByWorkspace,
  bulkSaveActivityLogs,
  replaceActivityLogsForWorkspace,
} from '../db/repositories/logsRepository.js';
import {
  softDeleteTenantUserRow,
  restoreTenantUserRow,
  findTenantUserRowById,
  listTenantUsersByIds,
} from '../db/repositories/tenantUserRepository.js';
import {
  aggregateUsersCommandMetrics,
  countTenantUsersActive,
  listTenantUsersPage,
} from '../db/repositories/tenantUserRepositoryList.js';
import { deleteRefreshTokensForUser } from './auth/authArtifactService.js';
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

export async function upsertWorkspaceUsers(records: WorkspaceUser[]): Promise<WorkspaceUser[]> {
  const parsed = workspaceUserListSchema.parse(records);
  const existing = await getHydratedUsers();

  const existingById = new Map(existing.map((u) => [String(u.id), u] as const));
  const updatesById = new Map(parsed.map((u) => [String(u.id), u] as const));

  // Merge by id to avoid wipe-risk when the client sends partial updates.
  // Soft-deleted rows are excluded from getHydratedUsers and stay untouched.
  const merged = existing.map((u) => updatesById.get(String(u.id)) ?? u);
  for (const update of parsed) {
    if (!existingById.has(String(update.id))) {
      merged.push(update as unknown as (typeof existing)[number]);
    }
  }

  await saveUsers(merged as unknown as Parameters<typeof saveUsers>[0]);
  return loadWorkspaceUsers();
}

export async function replaceWorkspaceUsers(records: WorkspaceUser[]): Promise<WorkspaceUser[]> {
  const parsed = workspaceUserListSchema.parse(records);
  await saveUsers(parsed);
  return parsed;
}

export async function deleteUserById(id: string, deletedBy: string): Promise<boolean> {
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

  const ok = await softDeleteTenantUserRow(id, deletedBy);
  if (ok) {
    await deleteRefreshTokensForUser(id);
  }
  return ok;
}

export async function restoreUserById(id: string): Promise<boolean> {
  return restoreTenantUserRow(id);
}

export async function bulkSoftDeleteUsers(
  ids: string[],
  deletedBy: string,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      const ok = await deleteUserById(id, deletedBy);
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
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  for (const id of ids) {
    const ok = await restoreUserById(id);
    if (ok) succeeded += 1;
    else failed += 1;
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
/** @deprecated Migration / admin restore only — API bulk PUT must use upsertLogs. */
export const replaceLogs = logService.replace;

/** Upserts supplied activity logs without removing unrelated rows. */
export async function upsertLogs(records: ActivityLog[]): Promise<ActivityLog[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = activityLogListSchema.parse(records);
  await bulkSaveActivityLogs(tenant, parsed);
  await broadcastCollection('user_activity_logs');
  return parsed;
}
