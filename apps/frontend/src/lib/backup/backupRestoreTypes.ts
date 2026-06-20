import type { WorkspaceBackupRecord, WorkspaceBackupSummary } from '@mms/shared';

export interface PendingRestore {
  jsonText: string;
  summary: WorkspaceBackupSummary;
  fileName?: string;
  credentials: { adminEmail: string; password: string };
}

export type PendingDecrypt =
  | { kind: 'file'; encryptedText: string; fileName: string; adminEmail: string }
  | { kind: 'history'; backup: WorkspaceBackupRecord }
  | { kind: 'plaintext'; jsonText: string; fileName: string };

export interface BackupCredentials {
  adminEmail: string;
  password: string;
}
