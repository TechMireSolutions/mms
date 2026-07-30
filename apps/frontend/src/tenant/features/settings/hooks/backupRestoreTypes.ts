import type { PendingDecrypt, PendingRestore, WorkspaceBackupRecord } from '@mms/shared';

export interface UseBackupRestoreOptions {
  subdomain: string | null | undefined;
  adminEmail: string;
}

export interface UseBackupRestoreResult {
  backups: WorkspaceBackupRecord[];
  historyCount: number;
  uploadLimitLabel: string;
  workspaceNote: string;
  tips: string[];
  isCreating: boolean;
  exportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  pendingDecrypt: PendingDecrypt | null;
  setPendingDecrypt: (value: PendingDecrypt | null) => void;
  decryptLoading: boolean;
  restoreId: string | null;
  pendingRestore: PendingRestore | null;
  clearHistoryOpen: boolean;
  setClearHistoryOpen: (open: boolean) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  selectedFileName: string | null;
  lastExportStats: {
    collections: number;
    objects: number;
    size: string;
  } | null;
  safetyStep: boolean;
  /** Safety backup downloaded — required before the destructive restore can run. */
  safetyReady: boolean;
  confirmPhrase: string;
  runEncryptedExport: (password: string, email: string) => Promise<void>;
  handleDecryptSubmit: (password: string, email: string) => Promise<void>;
  processImportFile: (file: File | undefined) => void;
  openHistoryRestore: (backup: WorkspaceBackupRecord) => void;
  handleDownloadBackup: (backup: WorkspaceBackupRecord) => void;
  handleClearHistory: () => void;
  createSafetyBackup: (password: string) => Promise<void>;
  beginRestore: (payload: PendingRestore) => Promise<void>;
  cancelRestore: () => void;
}
