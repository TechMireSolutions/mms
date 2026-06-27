import React from 'react';
import { CheckCircle2, Clock, HardDriveDownload, RefreshCw, AlertTriangle } from 'lucide-react';
import { BACKUP_HISTORY_MAX, type WorkspaceBackupRecord } from '@mms/shared';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { SettingsMetaBadge } from '@/components/ui/SettingsShell';
import { useTranslation } from '@/hooks/useTranslation';

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
    <SectionCard
      title={t('backup.historyTitle')}
      subtitle={t('backup.historyDesc')}
      icon={Clock}
      padding={false}
      className="border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 px-5 py-3.5 bg-muted/10">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-xs font-semibold text-foreground">{t('backup.historyTitle')}</span>
        </div>
        <SettingsMetaBadge variant={backups.length > 0 ? 'primary' : 'muted'}>
          {t('backup.historyCount', { count: backups.length, max: BACKUP_HISTORY_MAX })}
        </SettingsMetaBadge>
      </div>

      <div className="divide-y divide-border/40">
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" aria-hidden />
            <p className="text-xs font-medium text-muted-foreground">{t('backup.historyEmpty')}</p>
          </div>
        ) : (
          backups.map((backup) => {
            const isRestoringThis = restoreId === backup.id;
            return (
              <div
                key={backup.id}
                className="flex flex-wrap items-center gap-3 px-5 py-4 sm:gap-4 hover:bg-muted/30 transition-all duration-200 group/item"
              >
                <div className={`p-2 rounded-lg transition-colors duration-200 shrink-0 ${isRestoringThis ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                  {isRestoringThis ? (
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground truncate">{backup.name}</p>
                    <span className="text-[10px] font-semibold text-muted-foreground/80 bg-muted/65 px-1.5 py-0.5 rounded border border-border/20">
                      {backup.size}
                    </span>
                  </div>
                  
                  {backup.keyCount != null ? (
                    <p className="mt-1 text-[11px] text-muted-foreground/90 leading-normal">
                      {t('backup.exportStats', {
                        collections: backup.collectionCount ?? 0,
                        objects: backup.objectCount ?? 0,
                        size: backup.size,
                      })}
                    </p>
                  ) : null}
                  
                  {!backup.data ? (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-warning/90">
                      <AlertTriangle className="h-3 w-3 animate-pulse" aria-hidden />
                      <span>{t('backup.metadataOnly')}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-medium text-muted-foreground/70">{backup.date}</span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onRestore(backup)}
                      disabled={restoreId !== null || !backup.data}
                      className={`min-h-[32px] px-3 font-semibold text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                        isRestoringThis 
                          ? 'border-primary/30 text-primary bg-primary/5' 
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      }`}
                    >
                      {isRestoringThis ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin mr-1.5" aria-hidden />
                          {t('backup.restoring')}
                        </>
                      ) : (
                        t('backup.restore')
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => onDownload(backup)}
                      aria-label={t('backup.download')}
                      disabled={restoreId !== null}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 rounded-lg"
                    >
                      <HardDriveDownload className="h-4 w-4 transition-transform duration-300 group-hover/item:translate-y-0.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}
