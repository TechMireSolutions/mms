import { useCallback, useMemo, useState } from 'react';
import {
  appendBackupHistory,
  BACKUP_HISTORY_MAX_BYTES,
  BACKUP_UPLOAD_MAX_BYTES,
  buildBackupFileName,
  decryptWorkspaceBackup,
  DEFAULT_BACKUP_HISTORY,
  formatBackupSize,
  isEncryptedBackupPayload,
  parseEncryptedBackupFile,
  summarizeWorkspaceBackup,
  type WorkspaceBackupRecord,
  isBackupErrorKey,
  createBackupHistoryEntry,
  type PendingRestore,
  type PendingDecrypt,
  type BackupCredentials,
  type AppTranslationKey,
} from '@mms/shared';
import { exportEncryptedTenantBackup, getWorkspaceLocalStoragePrefix, importDatabase, saveCollection } from '@/lib/db';
import { verifyAdminBackupPassword } from '@/lib/backupAuth';
import { triggerFileDownload } from '@/lib/download';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { useBranding } from '@/tenant/hooks/useBranding';


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
  setPendingRestore: (value: PendingRestore | null) => void;
  clearHistoryOpen: boolean;
  setClearHistoryOpen: (open: boolean) => void;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  selectedFileName: string | null;
  setSelectedFileName: (name: string | null) => void;
  lastExportStats: {
    collections: number;
    objects: number;
    size: string;
  } | null;
  safetyStep: boolean;
  confirmPhrase: string;
  runEncryptedExport: (password: string, email: string) => Promise<void>;
  handleDecryptSubmit: (password: string, email: string) => Promise<void>;
  processImportFile: (file: File | undefined) => void;
  openHistoryRestore: (backup: WorkspaceBackupRecord) => void;
  handleDownloadBackup: (backup: WorkspaceBackupRecord) => void;
  handleClearHistory: () => void;
  beginRestore: (payload: PendingRestore) => Promise<void>;
}

export function useBackupRestore({
  subdomain,
  adminEmail,
}: UseBackupRestoreOptions): UseBackupRestoreResult {
  const { t } = useTranslation();
  const branding = useBranding();
  const backups = useLiveCollection<WorkspaceBackupRecord>('backups', DEFAULT_BACKUP_HISTORY);

  const [isCreating, setIsCreating] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [pendingDecrypt, setPendingDecrypt] = useState<PendingDecrypt | null>(null);
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [lastExportStats, setLastExportStats] = useState<{
    collections: number;
    objects: number;
    size: string;
  } | null>(null);
  const [safetyStep, setSafetyStep] = useState(false);

  const confirmPhrase = subdomain ?? 'RESTORE';
  const storagePrefix = getWorkspaceLocalStoragePrefix();
  const tenantLabel = branding.madrasaName?.trim() || subdomain || 'workspace';


  const errorDescription = useCallback(
    (message: string): string => (isBackupErrorKey(message) ? t(message) : message),
    [t],
  );

  const queuePlaintextRestore = useCallback(
    (jsonText: string, credentials: BackupCredentials, fileName?: string): void => {
      const preview = summarizeWorkspaceBackup(jsonText, storagePrefix);
      if (!preview.ok) {
        notify.error(t('backup.restoreFailed'), { description: t(preview.errorKey) });
        return;
      }
      setPendingRestore({ jsonText, summary: preview.summary, fileName, credentials });
    },
    [storagePrefix, t],
  );

  const downloadSafetyBackup = useCallback(
    async (credentials: BackupCredentials): Promise<void> => {
      const { encrypted } = await exportEncryptedTenantBackup(credentials, tenantLabel);
      triggerFileDownload(
        new Blob([encrypted], { type: 'application/json' }),
        buildBackupFileName(new Date(), { tenantSlug: subdomain, suffix: 'pre_restore', encrypted: true }),
      );
    },
    [subdomain, tenantLabel],
  );

  const beginRestore = useCallback(
    async (payload: PendingRestore): Promise<void> => {
      setSafetyStep(true);
      setRestoreId('active');
      try {
        await downloadSafetyBackup(payload.credentials);
        await importDatabase(payload.jsonText);
        notify.success(t('backup.restoreSuccess'), { description: t('backup.restoreSuccessDesc') });
        window.location.reload();
      } catch (err) {
        const error = err as Error;
        notify.error(t('backup.restoreFailed'), { description: errorDescription(error.message) });
        setRestoreId(null);
      } finally {
        setSafetyStep(false);
        setPendingRestore(null);
        setSelectedFileName(null);
      }
    },
    [downloadSafetyBackup, errorDescription, t],
  );

  const runEncryptedExport = useCallback(
    async (password: string, email: string): Promise<void> => {
      setIsCreating(true);
      try {
        const verified = await verifyAdminBackupPassword(email, password);
        if (!verified.ok) {
          notify.error(t('backup.createFailed'), { description: t(verified.errorKey) });
          return;
        }

        const credentials = { adminEmail: email.trim().toLowerCase(), password };
        const { encrypted, stats } = await exportEncryptedTenantBackup(credentials, tenantLabel);

        const now = new Date();
        const fileName = buildBackupFileName(now, { tenantSlug: subdomain, encrypted: true });
        triggerFileDownload(new Blob([encrypted], { type: 'application/json' }), fileName);

        setLastExportStats({
          collections: stats.collectionCount,
          objects: stats.objectCount,
          size: formatBackupSize(encrypted.length),
        });

        saveCollection(
          'backups',
          appendBackupHistory(
            backups,
            createBackupHistoryEntry(encrypted, now, t('backup.fullBackupName'), stats, {
              fileName,
              encrypted: true,
              adminEmail: credentials.adminEmail,
              maxInlineBytes: BACKUP_HISTORY_MAX_BYTES,
            }),
          ),
        );
        setExportModalOpen(false);
        notify.success(t('backup.createSuccess'), { description: t('backup.createSuccessDesc') });
      } catch (createError) {
        const backupError = createError as Error;
        notify.error(t('backup.createFailed'), {
          description: errorDescription(backupError.message),
        });
      } finally {
        setIsCreating(false);
      }
    },
    [backups, errorDescription, subdomain, t, tenantLabel],
  );

  const handleDecryptSubmit = useCallback(
    async (password: string, email: string): Promise<void> => {
      if (!pendingDecrypt) return;
      setDecryptLoading(true);
      try {
        const credentials = { adminEmail: email.trim().toLowerCase(), password };
        const isPlaintext = pendingDecrypt.kind === 'plaintext';
        let plaintext = '';
        let fileName = '';

        if (isPlaintext) {
          const verified = await verifyAdminBackupPassword(email, password);
          if (!verified.ok) {
            notify.error(t('backup.restoreFailed'), { description: t(verified.errorKey) });
            return;
          }
          plaintext = pendingDecrypt.jsonText;
          fileName = pendingDecrypt.fileName;
        } else {
          const encryptedText =
            pendingDecrypt.kind === 'file'
              ? pendingDecrypt.encryptedText
              : pendingDecrypt.backup.data ?? '';
          const result = await decryptWorkspaceBackup(encryptedText, credentials);
          if (!result.ok) {
            notify.error(t('backup.restoreFailed'), { description: t(result.errorKey) });
            return;
          }
          plaintext = result.plaintext;
          fileName =
            pendingDecrypt.kind === 'file'
              ? pendingDecrypt.fileName
              : pendingDecrypt.backup.fileName ?? pendingDecrypt.backup.name;
        }

        if (pendingDecrypt.kind !== 'history') {
          setSelectedFileName(fileName);
        }

        queuePlaintextRestore(plaintext, credentials, fileName);
        setPendingDecrypt(null);
      } finally {
        setDecryptLoading(false);
      }
    },
    [pendingDecrypt, queuePlaintextRestore, t],
  );

  const processImportFile = useCallback(
    (file: File | undefined): void => {
      if (!file) return;

      const fail = (key: AppTranslationKey, params?: Record<string, string | number>) => {
        notify.error(t('backup.restoreFailed'), { description: t(key, params) });
      };

      const lower = file.name.toLowerCase();
      const isJson = lower.endsWith('.json') || file.type === 'application/json';
      const isEncryptedExt = lower.endsWith('.mmsbak');
      if (!isJson && !isEncryptedExt) {
        fail('backup.invalidFormat');
        return;
      }

      if (file.size > BACKUP_UPLOAD_MAX_BYTES) {
        fail('backup.fileTooLarge', { max: formatBackupSize(BACKUP_UPLOAD_MAX_BYTES) });
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const text = loadEvent.target?.result;
        if (typeof text !== 'string') {
          fail('backup.invalidFormat');
          return;
        }

        const encryptedFile = parseEncryptedBackupFile(text);
        if (encryptedFile) {
          setPendingDecrypt({
            kind: 'file',
            encryptedText: text,
            fileName: file.name,
            adminEmail: encryptedFile.adminEmail || adminEmail,
          });
          return;
        }

        if (isEncryptedExt) {
          fail('backup.invalidFormat');
          return;
        }

        setPendingDecrypt({ kind: 'plaintext', jsonText: text, fileName: file.name });
      };
      reader.onerror = () => fail('backup.invalidFormat');
      reader.readAsText(file);
    },
    [adminEmail, t],
  );

  const openHistoryRestore = useCallback(
    (backup: WorkspaceBackupRecord): void => {
      if (!backup.data) {
        notify.error(t('backup.noData'), { description: t('backup.noDataDesc') });
        return;
      }
      if (backup.encrypted || isEncryptedBackupPayload(backup.data)) {
        setPendingDecrypt({ kind: 'history', backup });
        return;
      }
      setPendingDecrypt({
        kind: 'plaintext',
        jsonText: backup.data,
        fileName: backup.fileName ?? backup.name,
      });
    },
    [t],
  );

  const handleDownloadBackup = useCallback(
    (backup: WorkspaceBackupRecord): void => {
      if (!backup.data) {
        notify.error(t('backup.noData'), { description: t('backup.noDataDesc') });
        return;
      }
      const fileName =
        backup.fileName ??
        buildBackupFileName(new Date(backup.date), {
          tenantSlug: subdomain,
          encrypted: backup.encrypted ?? isEncryptedBackupPayload(backup.data),
        });
      triggerFileDownload(new Blob([backup.data], { type: 'application/json' }), fileName);
    },
    [subdomain, t],
  );

  const handleClearHistory = useCallback((): void => {
    saveCollection('backups', DEFAULT_BACKUP_HISTORY);
    setClearHistoryOpen(false);
    notify.success(t('settings.backupResetToast'), { description: t('settings.backupResetToastDesc') });
  }, [t]);

  const workspaceNote = useMemo(
    () => t('backup.workspaceScopeNote', { prefix: storagePrefix }),
    [storagePrefix, t],
  );

  const tips = useMemo(
    () => [t('backup.tipRegular'), t('backup.tipOffsite'), t('backup.tipVerify'), t('backup.tipHistoryLimit')],
    [t],
  );

  return useMemo(
    () => ({
      backups,
      historyCount: backups.length,
      uploadLimitLabel: formatBackupSize(BACKUP_UPLOAD_MAX_BYTES),
      workspaceNote,
      tips,
      isCreating,
      exportModalOpen,
      setExportModalOpen,
      pendingDecrypt,
      setPendingDecrypt,
      decryptLoading,
      restoreId,
      pendingRestore,
      setPendingRestore,
      clearHistoryOpen,
      setClearHistoryOpen,
      dragActive,
      setDragActive,
      selectedFileName,
      setSelectedFileName,
      lastExportStats,
      safetyStep,
      confirmPhrase,
      runEncryptedExport,
      handleDecryptSubmit,
      processImportFile,
      openHistoryRestore,
      handleDownloadBackup,
      handleClearHistory,
      beginRestore,
    }),
    [
      backups,
      workspaceNote,
      tips,
      isCreating,
      exportModalOpen,
      pendingDecrypt,
      decryptLoading,
      restoreId,
      pendingRestore,
      clearHistoryOpen,
      dragActive,
      selectedFileName,
      lastExportStats,
      safetyStep,
      confirmPhrase,
      runEncryptedExport,
      handleDecryptSubmit,
      processImportFile,
      openHistoryRestore,
      handleDownloadBackup,
      handleClearHistory,
      beginRestore,
    ]
  );
}
