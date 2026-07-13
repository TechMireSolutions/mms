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
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

// --- Users ---
export async function loadWorkspaceUsers(): Promise<WorkspaceUser[]> {
  const users = await getHydratedUsers();
  return users.map((u) => normalizeWorkspaceUser(u));
}

export async function replaceWorkspaceUsers(records: WorkspaceUser[]): Promise<WorkspaceUser[]> {
  const parsed = workspaceUserListSchema.parse(records);
  await saveUsers(parsed);
  return parsed;
}

// --- Activity Logs ---
const logService = defineTenantBulkCollectionService<ActivityLog>(
  { listByWorkspace: listActivityLogsByWorkspace, replaceForWorkspace: replaceActivityLogsForWorkspace },
  activityLogListSchema,
  'user_activity_logs',
);
export const loadLogs = logService.load;
export const replaceLogs = logService.replace;
