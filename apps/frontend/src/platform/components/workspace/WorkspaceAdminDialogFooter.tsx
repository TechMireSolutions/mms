import { ActionButton } from '@/components/ui/ActionButton';
import { useTranslation } from '@/hooks/useTranslation';

export function WorkspaceAdminDialogFooter({ complete, pending, confirmLabel, onClose, onConfirm, form }: {
  complete: boolean;
  pending: boolean;
  confirmLabel: string;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
  form?: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  if (complete) return <ActionButton variant="primary" onClick={onClose}>{t('common.close')}</ActionButton>;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5 w-full">
      <ActionButton variant="secondary" onClick={onClose} disabled={pending}>{t('common.cancel')}</ActionButton>
      <ActionButton
        type={form ? 'submit' : 'button'}
        form={form}
        variant="primary"
        onClick={onConfirm}
        loading={pending}
      >
        {confirmLabel}
      </ActionButton>
    </div>
  );
}
