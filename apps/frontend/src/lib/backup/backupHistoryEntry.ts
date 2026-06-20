import {
  formatBackupSize,
  formatBackupTimestamp,
  type WorkspaceBackupRecord,
  type WorkspaceBackupStats,
} from '@mms/shared';

export function createBackupHistoryEntry(
  dataStr: string,
  now: Date,
  name: string,
  stats: WorkspaceBackupStats,
  meta: { fileName: string; encrypted: boolean; adminEmail: string; maxInlineBytes: number },
): WorkspaceBackupRecord {
  return {
    id: `b${Date.now()}`,
    name,
    date: formatBackupTimestamp(now),
    size: formatBackupSize(dataStr.length),
    status: 'success',
    data: dataStr.length <= meta.maxInlineBytes ? dataStr : undefined,
    keyCount: stats.keyCount,
    collectionCount: stats.collectionCount,
    objectCount: stats.objectCount,
    fileName: meta.fileName,
    encrypted: meta.encrypted,
    adminEmail: meta.adminEmail,
  };
}
