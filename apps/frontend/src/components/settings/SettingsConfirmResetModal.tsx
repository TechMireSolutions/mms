import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AppTranslationKey } from '@mms/shared';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import useTranslation from '@/hooks/useTranslation';

interface SettingsConfirmResetModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  titleKey: AppTranslationKey;
  descKey: AppTranslationKey;
  warningKey: AppTranslationKey;
  loading?: boolean;
}

export default function SettingsConfirmResetModal({
  open,
  onClose,
  onConfirm,
  titleKey,
  descKey,
  warningKey,
  loading = false,
}: SettingsConfirmResetModalProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title={t(titleKey)}
      subtitle={t(descKey)}
      icon={AlertTriangle}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {t('theme.confirmCancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={() => void onConfirm()} disabled={loading}>
            {t('theme.confirmResetAction')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">{t(warningKey)}</p>
    </Modal>
  );
}
