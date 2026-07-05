import {
  type WorkspaceUser,
  type ActivityLog,
  normalizeWorkspaceUser,
  workspaceUserListSchema,
  activityLogListSchema,
} from '@mms/shared';
import { getHydratedUsers, saveUsers } from './auth/userService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listActivityLogsByWorkspace,
  replaceActivityLogsForWorkspace,
} from '../db/repositories/logsRepository.js';

// --- Helper WebSocket broadcaster ---
async function broadcast(logicalKey: string) {
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', logicalKey);
  }
}

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
export async function loadLogs(): Promise<ActivityLog[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listActivityLogsByWorkspace(tenant);
}

export async function replaceLogs(records: ActivityLog[]): Promise<ActivityLog[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = activityLogListSchema.parse(records);
  await replaceActivityLogsForWorkspace(tenant, parsed);
  await broadcast('user_activity_logs');
  return parsed;
}
