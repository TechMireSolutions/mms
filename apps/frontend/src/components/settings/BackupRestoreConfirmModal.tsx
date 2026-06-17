import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatBackupSize, type WorkspaceBackupSummary } from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCallout, SettingsMetaBadge } from '@/components/settings/SettingsShared';

export interface BackupRestoreConfirmModalProps {
  open: boolean;
  onClose: () => void;
  summary: WorkspaceBackupSummary | null;
  confirmPhrase: string;
  restoring?: boolean;
  safetyStep?: boolean;
  onConfirm: () => void;
}

function formatExportedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function BackupRestoreConfirmModal({
  open,
  onClose,
  summary,
  confirmPhrase,
  restoring = false,
  safetyStep = false,
  onConfirm,
}: BackupRestoreConfirmModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const phraseOk = typed.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();
  const exportedLabel = useMemo(
    () => formatExportedAt(summary?.exportedAt ?? null),
    [summary?.exportedAt],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('backup.confirmRestoreTitle')}
      subtitle={t('backup.confirmRestoreDesc')}
      icon={AlertTriangle}
      size="md"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={restoring}>
            {t('backup.confirmCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!phraseOk || restoring || safetyStep}
            onClick={onConfirm}
          >
            {restoring
              ? t('backup.restoring')
              : safetyStep
                ? t('backup.safetyBackupCreating')
                : t('backup.confirmRestoreAction')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <SettingsCallout variant="warning">
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('backup.restoreWarning')}
          </span>
        </SettingsCallout>

        {summary ? (
          <div className="rounded-xl border border-border bg-muted/15 p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">{t('backup.previewTitle')}</p>
            <div className="flex flex-wrap gap-2">
              <SettingsMetaBadge variant="primary">
                {t('backup.previewKeys', { count: summary.keyCount })}
              </SettingsMetaBadge>
              <SettingsMetaBadge variant="muted">
                {t('backup.previewCollections', { count: summary.collectionCount })}
              </SettingsMetaBadge>
              <SettingsMetaBadge variant="muted">
                {t('backup.previewObjects', { count: summary.objectCount })}
              </SettingsMetaBadge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('backup.previewSize', { size: formatBackupSize(summary.byteSize) })}
            </p>
            {exportedLabel ? (
              <p className="text-xs text-muted-foreground">
                {t('backup.previewExportedAt', { date: exportedLabel })}
              </p>
            ) : null}
            {summary.legacyFormat ? (
              <p className="text-xs text-warning">{t('backup.previewLegacyFormat')}</p>
            ) : null}
            {summary.dataSource === 'server' ? (
              <p className="text-xs text-primary">{t('backup.previewServerSource')}</p>
            ) : summary.dataSource === 'local' ? (
              <p className="text-xs text-warning">{t('backup.previewLocalSource')}</p>
            ) : null}
          </div>
        ) : null}

        <SettingsCallout>{t('backup.safetyBackupNote')}</SettingsCallout>

        <div className="space-y-2">
          <Label htmlFor="backup-confirm-phrase">
            {t('backup.confirmTypeLabel', { phrase: confirmPhrase })}
          </Label>
          <Input
            id="backup-confirm-phrase"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={t('backup.confirmTypePlaceholder')}
            autoComplete="off"
            disabled={restoring}
          />
        </div>
      </div>
    </Modal>
  );
}
