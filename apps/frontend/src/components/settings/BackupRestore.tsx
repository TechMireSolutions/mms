import React, { useCallback, useMemo, useState } from 'react';
import {
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  ShieldAlert,
  HardDriveDownload,
  ListChecks,
} from 'lucide-react';
import {
  appendBackupHistory,
  BACKUP_HISTORY_MAX,
  BACKUP_HISTORY_MAX_BYTES,
  BACKUP_UPLOAD_MAX_BYTES,
  buildBackupFileName,
  computeBackupStats,
  decryptWorkspaceBackup,
  DEFAULT_BACKUP_HISTORY,
  encryptWorkspaceBackup,
  extractBackupRawKeys,
  formatBackupSize,
  formatBackupTimestamp,
  isEncryptedBackupPayload,
  summarizeWorkspaceBackup,
  type AppTranslationKey,
  type WorkspaceBackupRecord,
  type WorkspaceBackupStats,
  type WorkspaceBackupSummary,
} from '@mms/shared';
import { exportTenantBackup, getWorkspaceLocalStoragePrefix, importDatabase, saveCollection } from '../../lib/db';
import { verifyAdminBackupPassword } from '@/lib/backupAuth';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import { usePermissions } from '@/hooks/usePermissions';
import { useTenant } from '@/lib/contexts/TenantContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import useBranding from '@/hooks/useBranding';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import SettingsFormActions from '@/components/ui/SettingsFormActions';
import BackupRestoreConfirmModal from '@/components/settings/BackupRestoreConfirmModal';
import BackupCredentialsModal from '@/components/settings/BackupCredentialsModal';
import {
  SettingsCallout,
  SettingsMetaBadge,
  SettingsPanel,
} from '@/components/settings/SettingsShared';

function triggerDownload(fileName: string, jsonText: string): void {
  const blob = new Blob([jsonText], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function isBackupErrorKey(message: string): message is AppTranslationKey {
  return message.startsWith('backup.');
}

interface PendingRestore {
  jsonText: string;
  summary: WorkspaceBackupSummary;
  fileName?: string;
  credentials: { adminEmail: string; password: string };
}

type PendingDecrypt =
  | { kind: 'file'; encryptedText: string; fileName: string; adminEmail: string }
  | { kind: 'history'; backup: WorkspaceBackupRecord }
  | { kind: 'plaintext'; jsonText: string; fileName: string };

/**
 * Full-workspace backup export, validated restore, and local backup history.
 */
export default function BackupRestore(): React.JSX.Element {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { subdomain } = useTenant();
  const { user } = useAuth();
  const branding = useBranding();
  const isAdmin = can('settings.global.write');
  const adminEmail = user?.email ?? '';

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
  const [lastExportStats, setLastExportStats] = useState<string | null>(null);
  const [safetyStep, setSafetyStep] = useState(false);

  const confirmPhrase = subdomain ?? 'RESTORE';
  const storagePrefix = getWorkspaceLocalStoragePrefix();
  const historyCount = backups.length;
  const uploadLimitLabel = formatBackupSize(BACKUP_UPLOAD_MAX_BYTES);

  const persistHistory = useCallback((next: WorkspaceBackupRecord[]): void => {
    saveCollection('backups', next);
  }, []);

  const errorDescription = useCallback(
    (message: string): string =>
      isBackupErrorKey(message) ? t(message) : message,
    [t],
  );

  const createHistoryEntry = (
    dataStr: string,
    now: Date,
    name: string,
    stats: WorkspaceBackupStats,
    meta: { fileName: string; encrypted: boolean; adminEmail: string },
  ): WorkspaceBackupRecord => ({
    id: `b${Date.now()}`,
    name,
    date: formatBackupTimestamp(now),
    size: formatBackupSize(dataStr.length),
    status: 'success',
    data: dataStr.length <= BACKUP_HISTORY_MAX_BYTES ? dataStr : undefined,
    keyCount: stats.keyCount,
    collectionCount: stats.collectionCount,
    objectCount: stats.objectCount,
    fileName: meta.fileName,
    encrypted: meta.encrypted,
    adminEmail: meta.adminEmail,
  });

  const tenantLabel = branding.madrasaName?.trim() || subdomain || 'workspace';

  const runEncryptedExport = async (password: string, email: string): Promise<void> => {
    setIsCreating(true);
    try {
      const verified = await verifyAdminBackupPassword(email, password);
      if (!verified.ok) {
        notify.error(t('backup.createFailed'), { description: t(verified.errorKey) });
        return;
      }

      const plaintext = await exportTenantBackup();
      const raw = extractBackupRawKeys(JSON.parse(plaintext) as unknown) ?? {};
      const stats = computeBackupStats(raw);

      const encrypted = await encryptWorkspaceBackup(
        plaintext,
        { adminEmail: email, password },
        { subdomain, tenantLabel },
      );

      const now = new Date();
      const fileName = buildBackupFileName(now, { tenantSlug: subdomain, encrypted: true });
      triggerDownload(fileName, encrypted);

      setLastExportStats(
        t('backup.exportStats', {
          collections: stats.collectionCount,
          objects: stats.objectCount,
          size: formatBackupSize(encrypted.length),
        }),
      );

      persistHistory(
        appendBackupHistory(
          backups,
          createHistoryEntry(encrypted, now, t('backup.fullBackupName'), stats, {
            fileName,
            encrypted: true,
            adminEmail: email.trim().toLowerCase(),
          }),
        ),
      );
      setExportModalOpen(false);
      notify.success(t('backup.createSuccess'), { description: t('backup.createSuccessDesc') });
    } catch (error) {
      const err = error as Error;
      notify.error(t('backup.createFailed'), {
        description: isBackupErrorKey(err.message) ? t(err.message) : err.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const downloadSafetyBackup = async (credentials: {
    adminEmail: string;
    password: string;
  }): Promise<void> => {
    const plaintext = await exportTenantBackup();
    const encrypted = await encryptWorkspaceBackup(
      plaintext,
      credentials,
      { subdomain, tenantLabel },
    );
    triggerDownload(
      buildBackupFileName(new Date(), { tenantSlug: subdomain, suffix: 'pre_restore', encrypted: true }),
      encrypted,
    );
  };

  const runRestore = async (jsonText: string): Promise<void> => {
    setRestoreId('active');
    try {
      await importDatabase(jsonText);
      notify.success(t('backup.restoreSuccess'), { description: t('backup.restoreSuccessDesc') });
      window.location.reload();
    } catch (err) {
      const error = err as Error;
      notify.error(t('backup.restoreFailed'), { description: errorDescription(error.message) });
      setRestoreId(null);
    }
  };

  const beginRestore = async (payload: PendingRestore): Promise<void> => {
    setSafetyStep(true);
    try {
      await downloadSafetyBackup(payload.credentials);
      await runRestore(payload.jsonText);
    } finally {
      setSafetyStep(false);
      setPendingRestore(null);
      setSelectedFileName(null);
    }
  };

  const queuePlaintextRestore = (
    jsonText: string,
    credentials: { adminEmail: string; password: string },
    fileName?: string,
  ): void => {
    const preview = summarizeWorkspaceBackup(jsonText, storagePrefix);
    if (!preview.ok) {
      notify.error(t('backup.restoreFailed'), { description: t(preview.errorKey) });
      return;
    }
    setPendingRestore({
      jsonText,
      summary: preview.summary,
      fileName,
      credentials,
    });
  };

  const openHistoryRestore = (backup: WorkspaceBackupRecord): void => {
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
  };

  const handleDecryptSubmit = async (password: string, email: string): Promise<void> => {
    if (!pendingDecrypt) return;
    setDecryptLoading(true);
    try {
      const credentials = { adminEmail: email.trim().toLowerCase(), password };

      if (pendingDecrypt.kind === 'plaintext') {
        const verified = await verifyAdminBackupPassword(email, password);
        if (!verified.ok) {
          notify.error(t('backup.restoreFailed'), { description: t(verified.errorKey) });
          return;
        }
        setSelectedFileName(pendingDecrypt.fileName);
        queuePlaintextRestore(pendingDecrypt.jsonText, credentials, pendingDecrypt.fileName);
        setPendingDecrypt(null);
        return;
      }

      const encryptedText =
        pendingDecrypt.kind === 'file'
          ? pendingDecrypt.encryptedText
          : pendingDecrypt.backup.data ?? '';
      const result = await decryptWorkspaceBackup(encryptedText, credentials);
      if (!result.ok) {
        notify.error(t('backup.restoreFailed'), { description: t(result.errorKey) });
        return;
      }

      if (pendingDecrypt.kind === 'file') {
        setSelectedFileName(pendingDecrypt.fileName);
        queuePlaintextRestore(result.plaintext, credentials, pendingDecrypt.fileName);
      } else {
        queuePlaintextRestore(
          result.plaintext,
          credentials,
          pendingDecrypt.backup.fileName ?? pendingDecrypt.backup.name,
        );
      }
      setPendingDecrypt(null);
    } finally {
      setDecryptLoading(false);
    }
  };

  const processImportFile = (file: File | undefined): void => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isJson = lower.endsWith('.json') || file.type === 'application/json';
    const isEncryptedExt = lower.endsWith('.mmsbak');
    if (!isJson && !isEncryptedExt) {
      notify.error(t('backup.restoreFailed'), { description: t('backup.invalidFormat') });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') {
        notify.error(t('backup.restoreFailed'), { description: t('backup.invalidFormat') });
        return;
      }

      if (isEncryptedBackupPayload(text)) {
        const parsed = JSON.parse(text) as { adminEmail?: string };
        setPendingDecrypt({
          kind: 'file',
          encryptedText: text,
          fileName: file.name,
          adminEmail: typeof parsed.adminEmail === 'string' ? parsed.adminEmail : adminEmail,
        });
        return;
      }

      if (isEncryptedExt) {
        notify.error(t('backup.restoreFailed'), { description: t('backup.invalidFormat') });
        return;
      }

      setPendingDecrypt({ kind: 'plaintext', jsonText: text, fileName: file.name });
    };
    reader.onerror = () => {
      notify.error(t('backup.restoreFailed'), { description: t('backup.invalidFormat') });
    };
    reader.readAsText(file);
  };

  const handleDownloadBackup = (backup: WorkspaceBackupRecord): void => {
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
    triggerDownload(fileName, backup.data);
  };

  const handleClearHistory = (): void => {
    persistHistory(DEFAULT_BACKUP_HISTORY);
    setClearHistoryOpen(false);
    notify.success(t('settings.backupResetToast'), { description: t('settings.backupResetToastDesc') });
  };

  const workspaceNote = useMemo(
    () =>
      t('backup.workspaceScopeNote', {
        prefix: storagePrefix,
      }),
    [t, storagePrefix],
  );

  const tips = useMemo(
    () => [t('backup.tipRegular'), t('backup.tipOffsite'), t('backup.tipVerify'), t('backup.tipHistoryLimit')],
    [t],
  );

  if (!isAdmin) {
    return (
      <SettingsPanel width="medium" introKey="settings.introBackup">
        <SectionCard title={t('backup.adminOnlyTitle')} icon={ShieldAlert}>
          <SettingsCallout variant="warning">{t('backup.adminOnlyDesc')}</SettingsCallout>
        </SectionCard>
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel
      width="wide"
      introKey="settings.introBackup"
      footer={
        <SettingsFormActions
          resetLabel={t('backup.clearHistory')}
          saveLabel={t('global.saveSettings')}
          onReset={() => setClearHistoryOpen(true)}
          showSave={false}
        />
      }
    >
      <SettingsCallout>{t('backup.note')}</SettingsCallout>
      <p className="text-xs text-muted-foreground">{workspaceNote}</p>

      <SectionCard title={t('backup.tipsTitle')} icon={ListChecks} padding={false}>
        <ul className="divide-y divide-border/50">
          {tips.map((tip) => (
            <li key={tip} className="px-5 py-3 text-xs leading-relaxed text-muted-foreground">
              {tip}
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={t('backup.createTitle')} subtitle={t('backup.createDesc')} icon={Database}>
          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => setExportModalOpen(true)}
              disabled={isCreating || !adminEmail}
              className="gap-2"
            >
              {isCreating ? (
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              {isCreating ? t('backup.creating') : t('backup.createButton')}
            </Button>
            {lastExportStats ? (
              <p className="text-xs text-muted-foreground">{lastExportStats}</p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title={t('backup.restoreFileTitle')}
          subtitle={t('backup.restoreFileDesc')}
          icon={Upload}
        >
          <label
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              processImportFile(e.dataTransfer?.files?.[0]);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-all ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/40 hover:bg-muted/20'
            }`}
          >
            <Upload
              className={`mb-2 h-7 w-7 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}
              aria-hidden
            />
            <span className="text-sm font-semibold text-foreground">
              {dragActive ? t('backup.dropzoneActive') : t('backup.dropzone')}
            </span>
            <span className="mt-0.5 text-xs text-muted-foreground">{t('backup.dropzoneHint')}</span>
            {selectedFileName ? (
              <span className="mt-2 text-xs font-medium text-primary">
                {t('backup.fileSelected', { name: selectedFileName })}
              </span>
            ) : null}
            <input
              type="file"
              accept=".json,.mmsbak,application/json"
              className="hidden"
              onChange={(e) => {
                processImportFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <div className="mt-4">
            <SettingsCallout variant="warning">
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {t('backup.restoreWarning')}
              </span>
            </SettingsCallout>
          </div>
        </SectionCard>
      </div>

      <SectionCard title={t('backup.historyTitle')} subtitle={t('backup.historyDesc')} icon={Clock} padding={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2">
          <SettingsMetaBadge variant={historyCount > 0 ? 'primary' : 'muted'}>
            {t('backup.historyCount', { count: historyCount, max: BACKUP_HISTORY_MAX })}
          </SettingsMetaBadge>
        </div>
        <div className="divide-y divide-border/50">
          {backups.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t('backup.historyEmpty')}</p>
          ) : (
            backups.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 hover:bg-muted/10"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.size}</p>
                  {b.keyCount != null ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t('backup.exportStats', {
                        collections: b.collectionCount ?? 0,
                        objects: b.objectCount ?? 0,
                        size: b.size,
                      })}
                    </p>
                  ) : null}
                  {!b.data ? (
                    <p className="mt-0.5 text-[11px] text-warning">{t('backup.metadataOnly')}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{b.date}</span>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openHistoryRestore(b)}
                    disabled={restoreId === b.id || !b.data}
                  >
                    {restoreId === b.id ? t('backup.restoring') : t('backup.restore')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadBackup(b)}
                    aria-label={t('backup.download')}
                  >
                    <HardDriveDownload className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <BackupCredentialsModal
        open={exportModalOpen}
        mode="export"
        adminEmail={adminEmail}
        emailReadOnly
        loading={isCreating}
        onClose={() => setExportModalOpen(false)}
        onSubmit={(password, email) => void runEncryptedExport(password, email)}
      />

      <BackupCredentialsModal
        open={pendingDecrypt !== null}
        mode="decrypt"
        adminEmail={
          pendingDecrypt?.kind === 'file'
            ? pendingDecrypt.adminEmail
            : pendingDecrypt?.kind === 'history'
              ? pendingDecrypt.backup.adminEmail ?? adminEmail
              : adminEmail
        }
        emailReadOnly={
          pendingDecrypt?.kind === 'file' ||
          (pendingDecrypt?.kind === 'history' && Boolean(pendingDecrypt.backup.adminEmail))
        }
        loading={decryptLoading}
        onClose={() => setPendingDecrypt(null)}
        onSubmit={(password, email) => void handleDecryptSubmit(password, email)}
      />

      <BackupRestoreConfirmModal
        open={pendingRestore !== null}
        onClose={() => {
          setPendingRestore(null);
          setSelectedFileName(null);
        }}
        summary={pendingRestore?.summary ?? null}
        confirmPhrase={confirmPhrase}
        restoring={restoreId !== null}
        safetyStep={safetyStep}
        onConfirm={() => {
          if (pendingRestore) void beginRestore(pendingRestore);
        }}
      />

      <Modal
        open={clearHistoryOpen}
        onClose={() => setClearHistoryOpen(false)}
        title={t('backup.clearHistoryConfirmTitle')}
        subtitle={t('backup.clearHistoryConfirmDesc')}
        icon={AlertTriangle}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setClearHistoryOpen(false)}>
              {t('backup.confirmCancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={handleClearHistory}>
              {t('backup.clearHistoryConfirmAction')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">{t('backup.clearHistoryConfirmDesc')}</p>
      </Modal>
    </SettingsPanel>
  );
}
