import { ModuleSoftDeleteConfirmDialogs } from '@/components/ui/ModuleSoftDeleteConfirmDialogs';
import { useTranslation } from '@/hooks/useTranslation';

interface TeacherListConfirmDialogsProps {
  selectedCount: number;
  confirmBulkDeleteOpen: boolean;
  confirmBulkRestoreOpen: boolean;
  pendingDeleteId: string | null;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onPendingDeleteChange: (id: string | null) => void;
  onConfirmBulkDelete: (reason?: string) => void;
  onConfirmBulkRestore: () => void;
  onConfirmDelete: (reason?: string) => void;
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
    <ModuleSoftDeleteConfirmDialogs
      pendingDeleteOpen={pendingDeleteId != null}
      onPendingDeleteOpenChange={(open) => {
        if (!open) onPendingDeleteChange(null);
      }}
      bulkDeleteOpen={confirmBulkDeleteOpen}
      onBulkDeleteOpenChange={onBulkDeleteOpenChange}
      bulkRestoreOpen={confirmBulkRestoreOpen}
      onBulkRestoreOpenChange={onBulkRestoreOpenChange}
      singleDeleteTitle={t('teachers.confirmDeleteTitle')}
      singleDeleteDescription={t('teachers.confirmDeleteDescription')}
      bulkDeleteTitle={t('common.delete')}
      bulkDeleteDescription={t('teachers.bulkDeleteConfirm', { count: selectedCount })}
      bulkRestoreTitle={t('teachers.bulkRestore')}
      bulkRestoreDescription={t('teachers.bulkRestoreConfirm', { count: selectedCount })}
      deleteConfirmLabel={t('common.delete')}
      restoreConfirmLabel={t('teachers.restore')}
      cancelLabel={t('common.cancel')}
      deletionReasonLabel={t('teachers.deletionReasonLabel')}
      deletionReasonPlaceholder={t('teachers.deletionReasonPlaceholder')}
      onConfirmSingleDelete={onConfirmDelete}
      onConfirmBulkDelete={onConfirmBulkDelete}
      onConfirmBulkRestore={onConfirmBulkRestore}
    />
  );
}
