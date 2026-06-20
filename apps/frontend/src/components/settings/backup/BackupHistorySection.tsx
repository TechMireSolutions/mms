import React from 'react';
import { CheckCircle2, Clock, HardDriveDownload } from 'lucide-react';
import { BACKUP_HISTORY_MAX, type WorkspaceBackupRecord } from '@mms/shared';
import SectionCard from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import useTranslation from '@/hooks/useTranslation';

interface BackupHistorySectionProps {
  backups: WorkspaceBackupRecord[];
  restoreId: string | null;
  onRestore: (backup: WorkspaceBackupRecord) => void;
  onDownload: (backup: WorkspaceBackupRecord) => void;
}

export default function BackupHistorySection({
  backups,
  restoreId,
  onRestore,
  onDownload,
}: BackupHistorySectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SectionCard title={t('backup.historyTitle')} subtitle={t('backup.historyDesc')} icon={Clock} padding={false}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 px-4 py-2">
        <SettingsMetaBadge variant={backups.length > 0 ? 'primary' : 'muted'}>
          {t('backup.historyCount', { count: backups.length, max: BACKUP_HISTORY_MAX })}
        </SettingsMetaBadge>
      </div>
      <div className="divide-y divide-border/50">
        {backups.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t('backup.historyEmpty')}</p>
        ) : (
          backups.map((backup) => (
            <div
              key={backup.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 hover:bg-muted/10"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{backup.name}</p>
                <p className="text-xs text-muted-foreground">{backup.size}</p>
                {backup.keyCount != null ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t('backup.exportStats', {
                      collections: backup.collectionCount ?? 0,
                      objects: backup.objectCount ?? 0,
                      size: backup.size,
                    })}
                  </p>
                ) : null}
                {!backup.data ? (
                  <p className="mt-0.5 text-[11px] text-warning">{t('backup.metadataOnly')}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{backup.date}</span>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRestore(backup)}
                  disabled={restoreId === backup.id || !backup.data}
                >
                  {restoreId === backup.id ? t('backup.restoring') : t('backup.restore')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onDownload(backup)}
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
  );
}
