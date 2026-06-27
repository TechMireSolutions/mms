import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface BackupClearHistoryModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function BackupClearHistoryModal({
  open,
  onClose,
  onConfirm,
}: BackupClearHistoryModalProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('backup.clearHistoryConfirmTitle')}
      subtitle={t('backup.clearHistoryConfirmDesc')}
      icon={AlertTriangle}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('backup.confirmCancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t('backup.clearHistoryConfirmAction')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">{t('backup.clearHistoryConfirmDesc')}</p>
    </Modal>
  );
}
