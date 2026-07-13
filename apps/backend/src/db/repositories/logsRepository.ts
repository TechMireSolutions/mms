import { type ActivityLog, type AuditLogEntry } from '@mms/shared';
import { userActivityLogs, auditLogEntries } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const activityLogsRepo = createGenericRepository<ActivityLog, typeof userActivityLogs>(userActivityLogs);
const auditLogsRepo = createGenericRepository<AuditLogEntry, typeof auditLogEntries>(auditLogEntries, { updateStrategy: 'overwrite' });

export const listActivityLogsByWorkspace = activityLogsRepo.listByWorkspace;
export const replaceActivityLogsForWorkspace = activityLogsRepo.replaceForWorkspace;

export const listAuditLogEntriesByWorkspace = auditLogsRepo.listByWorkspace;
export const replaceAuditLogEntriesForWorkspace = auditLogsRepo.replaceForWorkspace;
export const saveAuditLogEntry = auditLogsRepo.save;

export async function deleteLogsByWorkspace(workspaceSubdomain: string): Promise<void> {
  await activityLogsRepo.deleteByWorkspace(workspaceSubdomain);
  await auditLogsRepo.deleteByWorkspace(workspaceSubdomain);
}
