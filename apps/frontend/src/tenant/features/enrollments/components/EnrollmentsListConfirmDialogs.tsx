import { ModuleSoftDeleteConfirmDialogs } from '@/components/ui/ModuleSoftDeleteConfirmDialogs';
import { useTranslation } from '@/hooks/useTranslation';

interface EnrollmentsListConfirmDialogsProps {
  pendingDeleteId: string | null;
  onPendingDeleteChange: (id: string | null) => void;
  onConfirmDelete: (reason?: string) => void;
}

/**
 * Soft-delete confirm for Enrollments Work (single-archive; no bulk selection UI yet).
 */
export function EnrollmentsListConfirmDialogs({
  pendingDeleteId,
  onPendingDeleteChange,
  onConfirmDelete,
}: EnrollmentsListConfirmDialogsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleSoftDeleteConfirmDialogs
      pendingDeleteOpen={pendingDeleteId != null}
      onPendingDeleteOpenChange={(open) => {
        if (!open) onPendingDeleteChange(null);
      }}
      bulkDeleteOpen={false}
      onBulkDeleteOpenChange={() => {}}
      bulkRestoreOpen={false}
      onBulkRestoreOpenChange={() => {}}
      singleDeleteTitle={t('enrollments.confirmDeleteTitle')}
      singleDeleteDescription={t('enrollments.confirmDeleteDescription')}
      bulkDeleteTitle={t('enrollments.confirmDeleteTitle')}
      bulkDeleteDescription={t('enrollments.confirmDeleteDescription')}
      bulkRestoreTitle={t('enrollments.restore')}
      bulkRestoreDescription={t('enrollments.restore')}
      deleteConfirmLabel={t('enrollments.archive')}
      restoreConfirmLabel={t('enrollments.restore')}
      cancelLabel={t('common.cancel')}
      deletionReasonLabel={t('enrollments.deletionReasonLabel')}
      deletionReasonPlaceholder={t('enrollments.deletionReasonPlaceholder')}
      onConfirmSingleDelete={onConfirmDelete}
      onConfirmBulkDelete={() => {}}
      onConfirmBulkRestore={() => {}}
    />
  );
}
