import React, { useCallback, useMemo, useState } from 'react';
import { Download, Upload, Clock, CheckCircle2, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import {
  appendBackupHistory,
  BACKUP_HISTORY_MAX,
  BACKUP_HISTORY_MAX_BYTES,
  buildBackupFileName,
  DEFAULT_BACKUP_HISTORY,
  formatBackupSize,
  formatBackupTimestamp,
  type AppTranslationKey,
  type WorkspaceBackupRecord,
} from '@mms/shared';
import { exportDatabase, getWorkspaceLocalStoragePrefix, importDatabase, saveCollection } from '../../lib/db';
import { notify } from '@/lib/notify';
import useTranslation from '@/hooks/useTranslation';
import { useLiveCollection } from '@/hooks/useLiveCollection';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import SettingsFormActions from '@/components/ui/SettingsFormActions';
import { SettingsCallout, SettingsMetaBadge, SettingsPanel } from '@/components/settings/SettingsShared';

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

/**
 * Full-workspace backup export, file restore, and local backup history.
 */
export default function BackupRestore(): React.JSX.Element {
  const { t } = useTranslation();
  const backups = useLiveCollection<WorkspaceBackupRecord>('backups', DEFAULT_BACKUP_HISTORY);
  const [isCreating, setIsCreating] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<WorkspaceBackupRecord | null>(null);
  const [pendingFileRestore, setPendingFileRestore] = useState<string | null>(null);

  const historyCount = backups.length;

  const persistHistory = useCallback((next: WorkspaceBackupRecord[]): void => {
    saveCollection('backups', next);
  }, []);

  const errorDescription = useCallback(
    (message: string): string =>
      isBackupErrorKey(message) ? t(message) : message,
    [t],
  );

  const handleCreateBackup = async (): Promise<void> => {
    setIsCreating(true);
    try {
      const dataStr = exportDatabase();
      const now = new Date();
      const fileName = buildBackupFileName(now);
      triggerDownload(fileName, dataStr);

      const storePayload =
        dataStr.length <= BACKUP_HISTORY_MAX_BYTES ? dataStr : undefined;

      const newEntry: WorkspaceBackupRecord = {
        id: `b${Date.now()}`,
        name: t('backup.fullBackupName'),
        date: formatBackupTimestamp(now),
        size: formatBackupSize(dataStr.length),
        status: 'success',
        data: storePayload,
      };

      persistHistory(appendBackupHistory(backups, newEntry));
      notify.success(t('backup.createSuccess'), { description: t('backup.createSuccessDesc') });
    } catch (error) {
      const err = error as Error;
      notify.error(t('backup.createFailed'), { description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const runRestore = async (jsonText: string): Promise<void> => {
    setRestoreId('active');
    try {
      importDatabase(jsonText);
      notify.success(t('backup.restoreSuccess'), { description: t('backup.restoreSuccessDesc') });
      window.location.reload();
    } catch (err) {
      const error = err as Error;
      notify.error(t('backup.restoreFailed'), { description: errorDescription(error.message) });
      setRestoreId(null);
    }
  };

  const confirmRestoreFromHistory = async (): Promise<void> => {
    if (!pendingRestore) return;
    if (!pendingRestore.data) {
      notify.error(t('backup.noData'), { description: t('backup.noDataDesc') });
      setPendingRestore(null);
      return;
    }
    const id = pendingRestore.id;
    setPendingRestore(null);
    setRestoreId(id);
    await runRestore(pendingRestore.data);
  };

  const confirmRestoreFromFile = async (): Promise<void> => {
    if (!pendingFileRestore) return;
    const payload = pendingFileRestore;
    setPendingFileRestore(null);
    await runRestore(payload);
  };

  const handleDownloadBackup = (backup: WorkspaceBackupRecord): void => {
    if (!backup.data) {
      notify.error(t('backup.noData'), { description: t('backup.noDataDesc') });
      return;
    }
    const cleanDate = backup.date.split(' ')[0];
    triggerDownload(`mms_backup_${cleanDate}.json`, backup.data);
  };

  const processImportFile = (file: File | undefined): void => {
    if (!file) return;
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
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
      setPendingFileRestore(text);
    };
    reader.onerror = () => {
      notify.error(t('backup.restoreFailed'), { description: t('backup.invalidFormat') });
    };
    reader.readAsText(file);
  };

  const handleClearHistory = (): void => {
    persistHistory(DEFAULT_BACKUP_HISTORY);
    notify.success(t('settings.backupResetToast'), { description: t('settings.backupResetToastDesc') });
  };

  const workspaceNote = useMemo(
    () =>
      t('backup.workspaceScopeNote', {
        prefix: getWorkspaceLocalStoragePrefix(),
      }),
    [t],
  );

  return (
    <SettingsPanel
      width="medium"
      introKey="settings.introBackup"
      footer={
        <SettingsFormActions
          resetLabel={t('backup.clearHistory')}
          saveLabel={t('global.saveSettings')}
          onReset={handleClearHistory}
          showSave={false}
        />
      }
    >
      <SettingsCallout>{t('backup.note')}</SettingsCallout>
      <p className="text-xs text-muted-foreground">{workspaceNote}</p>

      <SectionCard title={t('backup.createTitle')} subtitle={t('backup.createDesc')} icon={Database}>
        <Button
          type="button"
          onClick={() => void handleCreateBackup()}
          disabled={isCreating}
          className="gap-2"
        >
          {isCreating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isCreating ? t('backup.creating') : t('backup.createButton')}
        </Button>
      </SectionCard>

      <SectionCard title={t('backup.restoreFileTitle')} subtitle={t('backup.restoreFileDesc')} icon={Upload}>
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            processImportFile(e.dataTransfer?.files?.[0]);
          }}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card py-10 transition-all hover:border-primary/40 hover:bg-muted/20"
        >
          <Upload className="mb-2 h-7 w-7 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-foreground">{t('backup.dropzone')}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">{t('backup.dropzoneHint')}</span>
          <input
            type="file"
            accept=".json,application/json"
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

      <SectionCard title={t('backup.historyTitle')} subtitle={t('backup.historyDesc')} icon={Clock} padding={false}>
        <div className="border-b border-border/50 px-4 py-2">
          <SettingsMetaBadge variant={historyCount > 0 ? 'primary' : 'muted'}>
            {t('backup.historyCount', { count: historyCount, max: BACKUP_HISTORY_MAX })}
          </SettingsMetaBadge>
        </div>
        <div className="divide-y divide-border/50">
          {backups.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t('backup.historyEmpty')}</p>
          ) : (
            backups.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.size}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{b.date}</span>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingRestore(b)}
                    disabled={restoreId === b.id}
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
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <Modal
        open={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        title={t('backup.confirmRestoreTitle')}
        subtitle={t('backup.confirmRestoreDesc')}
        icon={AlertTriangle}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingRestore(null)}>
              {t('backup.confirmCancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmRestoreFromHistory()}>
              {t('backup.confirmRestoreAction')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">{t('backup.restoreWarning')}</p>
      </Modal>

      <Modal
        open={pendingFileRestore !== null}
        onClose={() => setPendingFileRestore(null)}
        title={t('backup.confirmRestoreTitle')}
        subtitle={t('backup.confirmRestoreDesc')}
        icon={AlertTriangle}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingFileRestore(null)}>
              {t('backup.confirmCancel')}
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmRestoreFromFile()}>
              {t('backup.confirmRestoreAction')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">{t('backup.restoreWarning')}</p>
      </Modal>
    </SettingsPanel>
  );
}
