/**
 * @file FacultyAssignmentsConfirmDialogs.tsx
 * @description Close/delete confirmation dialogs for faculty appointments.
 */

import type { FacultyAssignmentEntity } from '@mms/shared';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useTranslation } from '@/hooks/useTranslation';

export function FacultyAssignmentsConfirmDialogs({
  pendingClose,
  pendingDelete,
  onClearClose,
  onClearDelete,
  onConfirmClose,
  onConfirmDelete,
}: {
  pendingClose: FacultyAssignmentEntity | null;
  pendingDelete: FacultyAssignmentEntity | null;
  onClearClose: () => void;
  onClearDelete: () => void;
  onConfirmClose: (id: string) => Promise<void>;
  onConfirmDelete: (id: string) => Promise<void>;
}): React.JSX.Element {
  const { t } = useTranslation();
  const closeName = pendingClose?.designationName ?? pendingClose?.designationId ?? '';
  const deleteName = pendingDelete?.designationName ?? pendingDelete?.designationId ?? '';

  return (
    <>
      <ConfirmAlertDialog
        open={Boolean(pendingClose)}
        onOpenChange={(open) => {
          if (!open) onClearClose();
        }}
        title={t('faculty.assignments.closeConfirmTitle')}
        description={pendingClose ? t('faculty.assignments.closeConfirm', { name: closeName }) : ''}
        confirmLabel={t('faculty.assignments.close')}
        cancelLabel={t('common.cancel')}
        onConfirm={async () => {
          if (!pendingClose) return;
          await onConfirmClose(pendingClose.id);
          onClearClose();
        }}
      />
      <ConfirmAlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) onClearDelete();
        }}
        title={t('faculty.assignments.deleteConfirmTitle')}
        description={pendingDelete ? t('faculty.assignments.deleteConfirm', { name: deleteName }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={async () => {
          if (!pendingDelete) return;
          await onConfirmDelete(pendingDelete.id);
          onClearDelete();
        }}
      />
    </>
  );
}
