import {
  type WorkspaceUser,
  type ActivityLog,
  normalizeWorkspaceUser,
  workspaceUserListSchema,
  activityLogListSchema,
} from '@mms/shared';
import { getHydratedUsers, saveUsers } from './auth/userService.js';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const LOGS_COLLECTION = 'user_activity_logs';

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
const logCrud = defineCollectionCrudService(LOGS_COLLECTION, activityLogListSchema, (record: ActivityLog) => record);
export const loadLogs = logCrud.load;
export async function replaceLogs(records: ActivityLog[]): Promise<ActivityLog[]> {
  const parsed = activityLogListSchema.parse(records);
  await persistCollection(LOGS_COLLECTION, parsed);
  return parsed;
}
