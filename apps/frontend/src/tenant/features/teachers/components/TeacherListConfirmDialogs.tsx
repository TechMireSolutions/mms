import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useTranslation } from '@/hooks/useTranslation';

interface TeacherListConfirmDialogsProps {
  selectedCount: number;
  confirmBulkDeleteOpen: boolean;
  confirmBulkRestoreOpen: boolean;
  pendingDeleteId: string | null;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onPendingDeleteChange: (id: string | null) => void;
  onConfirmBulkDelete: () => void;
  onConfirmBulkRestore: () => void;
  onConfirmDelete: () => void;
}

export function TeacherListConfirmDialogs({
  selectedCount,
  confirmBulkDeleteOpen,
  confirmBulkRestoreOpen,
  pendingDeleteId,
  onBulkDeleteOpenChange,
  onBulkRestoreOpenChange,
  onPendingDeleteChange,
  onConfirmBulkDelete,
  onConfirmBulkRestore,
  onConfirmDelete,
}: TeacherListConfirmDialogsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmAlertDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={onBulkDeleteOpenChange}
        title={t('common.delete')}
        description={t('teachers.bulkDeleteConfirm', { count: selectedCount })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirmBulkDelete}
      />

      <ConfirmAlertDialog
        open={confirmBulkRestoreOpen}
        onOpenChange={onBulkRestoreOpenChange}
        title={t('teachers.bulkRestore')}
        description={t('teachers.bulkRestoreConfirm', { count: selectedCount })}
        confirmLabel={t('teachers.restore')}
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirmBulkRestore}
      />

      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => { if (!open) onPendingDeleteChange(null); }}
        title={t('teachers.confirmDeleteTitle')}
        description={t('teachers.confirmDeleteDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
