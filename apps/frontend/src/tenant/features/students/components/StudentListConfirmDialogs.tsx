import type { ReactElement } from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";

export interface StudentListConfirmDialogsProps {
  pendingDeleteId: string | null;
  onPendingDeleteIdChange: (id: string | null) => void;
  confirmBulkDeleteOpen: boolean;
  onConfirmBulkDeleteOpenChange: (open: boolean) => void;
  confirmBulkRestoreOpen: boolean;
  onConfirmBulkRestoreOpenChange: (open: boolean) => void;
  selectedIds: string[];
  deleteTitle: string;
  deleteDescription: string;
  removeLabel: string;
  cancelLabel: string;
  deletionReasonLabel: string;
  deletionReasonPlaceholder: string;
  confirmRemoveSelectedDescription: string;
  bulkRestoreTitle: string;
  bulkRestoreDescription: string;
  restoreLabel: string;
  onDelete: (id: string, deletionReason?: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[], deletionReason?: string) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  onClearSelection: () => void;
}

/** Soft-delete / restore confirmation dialogs for Students Work list. */
export function StudentListConfirmDialogs({
  pendingDeleteId,
  onPendingDeleteIdChange,
  confirmBulkDeleteOpen,
  onConfirmBulkDeleteOpenChange,
  confirmBulkRestoreOpen,
  onConfirmBulkRestoreOpenChange,
  selectedIds,
  deleteTitle,
  deleteDescription,
  removeLabel,
  cancelLabel,
  deletionReasonLabel,
  deletionReasonPlaceholder,
  confirmRemoveSelectedDescription,
  bulkRestoreTitle,
  bulkRestoreDescription,
  restoreLabel,
  onDelete,
  onBulkDelete,
  onBulkRestore,
  onClearSelection,
}: StudentListConfirmDialogsProps): ReactElement {
  return (
    <>
      <ConfirmAlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) onPendingDeleteIdChange(null);
        }}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel={removeLabel}
        cancelLabel={cancelLabel}
        destructive
        optionalReason={{
          label: deletionReasonLabel,
          placeholder: deletionReasonPlaceholder,
        }}
        onConfirm={async (reason) => {
          if (!pendingDeleteId) return false;
          await onDelete(pendingDeleteId, reason);
          onPendingDeleteIdChange(null);
        }}
      />

      <ConfirmAlertDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={onConfirmBulkDeleteOpenChange}
        title={removeLabel}
        description={confirmRemoveSelectedDescription}
        confirmLabel={removeLabel}
        cancelLabel={cancelLabel}
        destructive
        optionalReason={{
          label: deletionReasonLabel,
          placeholder: deletionReasonPlaceholder,
        }}
        onConfirm={async (reason) => {
          if (!onBulkDelete) return false;
          await onBulkDelete(selectedIds, reason);
          onClearSelection();
        }}
      />

      <ConfirmAlertDialog
        open={confirmBulkRestoreOpen}
        onOpenChange={onConfirmBulkRestoreOpenChange}
        title={bulkRestoreTitle}
        description={bulkRestoreDescription}
        confirmLabel={restoreLabel}
        cancelLabel={cancelLabel}
        onConfirm={async () => {
          if (!onBulkRestore) return false;
          await onBulkRestore(selectedIds);
          onClearSelection();
        }}
      />
    </>
  );
}
