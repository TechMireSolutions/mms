import {
  type WorkspaceUser,
  type ActivityLog,
  normalizeWorkspaceUser,
  workspaceUserListSchema,
  activityLogListSchema,
} from '@mms/shared';
import { getHydratedUsers, saveUsers } from './auth/userService.js';
import {
  listActivityLogsByWorkspace,
  replaceActivityLogsForWorkspace,
} from '../db/repositories/logsRepository.js';
import {
  softDeleteTenantUserRow,
  restoreTenantUserRow,
  findTenantUserRowById,
} from '../db/repositories/tenantUserRepository.js';
import { deleteRefreshTokensForUser } from './auth/authArtifactService.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

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
export const replaceLogs = logService.replace;
