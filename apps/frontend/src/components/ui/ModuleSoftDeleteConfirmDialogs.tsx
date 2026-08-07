import type { ReactElement } from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";

export interface ModuleSoftDeleteConfirmDialogsProps {
  pendingDeleteOpen: boolean;
  onPendingDeleteOpenChange: (open: boolean) => void;
  bulkDeleteOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  bulkRestoreOpen: boolean;
  onBulkRestoreOpenChange: (open: boolean) => void;
  singleDeleteTitle: string;
  singleDeleteDescription: string;
  bulkDeleteTitle: string;
  bulkDeleteDescription: string;
  bulkRestoreTitle: string;
  bulkRestoreDescription: string;
  deleteConfirmLabel: string;
  restoreConfirmLabel: string;
  cancelLabel?: string;
  deletionReasonLabel: string;
  deletionReasonPlaceholder: string;
  onConfirmSingleDelete: (reason?: string) => void | Promise<void | boolean>;
  onConfirmBulkDelete: (reason?: string) => void | Promise<void | boolean>;
  onConfirmBulkRestore: () => void | Promise<void | boolean>;
}

/** Soft-delete confirm trio shared by Contacts/Students Work. */
export function ModuleSoftDeleteConfirmDialogs({
  pendingDeleteOpen,
  onPendingDeleteOpenChange,
  bulkDeleteOpen,
  onBulkDeleteOpenChange,
  bulkRestoreOpen,
  onBulkRestoreOpenChange,
  singleDeleteTitle,
  singleDeleteDescription,
  bulkDeleteTitle,
  bulkDeleteDescription,
  bulkRestoreTitle,
  bulkRestoreDescription,
  deleteConfirmLabel,
  restoreConfirmLabel,
  cancelLabel,
  deletionReasonLabel,
  deletionReasonPlaceholder,
  onConfirmSingleDelete,
  onConfirmBulkDelete,
  onConfirmBulkRestore,
}: ModuleSoftDeleteConfirmDialogsProps): ReactElement {
  const reason = {
    label: deletionReasonLabel,
    placeholder: deletionReasonPlaceholder,
  };

  return (
    <>
      <ConfirmAlertDialog
        open={pendingDeleteOpen}
        onOpenChange={onPendingDeleteOpenChange}
        title={singleDeleteTitle}
        description={singleDeleteDescription}
        confirmLabel={deleteConfirmLabel}
        cancelLabel={cancelLabel}
        destructive
        optionalReason={reason}
        onConfirm={onConfirmSingleDelete}
      />
      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={onBulkDeleteOpenChange}
        title={bulkDeleteTitle}
        description={bulkDeleteDescription}
        confirmLabel={deleteConfirmLabel}
        cancelLabel={cancelLabel}
        destructive
        optionalReason={reason}
        onConfirm={onConfirmBulkDelete}
      />
      <ConfirmAlertDialog
        open={bulkRestoreOpen}
        onOpenChange={onBulkRestoreOpenChange}
        title={bulkRestoreTitle}
        description={bulkRestoreDescription}
        confirmLabel={restoreConfirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={onConfirmBulkRestore}
      />
    </>
  );
}
