import React from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";

export interface QuestionBankTrashDialogsProps {
  pendingTrashId: string | null;
  onPendingTrashIdChange: (id: string | null) => void;
  confirmBulkOpen: boolean;
  onConfirmBulkOpenChange: (open: boolean) => void;
  showDeleted: boolean;
  selectedCount: number;
  onConfirmRowTrash: () => void;
  onConfirmBulkTrash: () => void;
}

export function QuestionBankTrashDialogs({
  pendingTrashId,
  onPendingTrashIdChange,
  confirmBulkOpen,
  onConfirmBulkOpenChange,
  showDeleted,
  selectedCount,
  onConfirmRowTrash,
  onConfirmBulkTrash,
}: QuestionBankTrashDialogsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmAlertDialog
        open={pendingTrashId !== null}
        onOpenChange={(open) => {
          if (!open) onPendingTrashIdChange(null);
        }}
        title={t("questionBank.trash.deleteTitle")}
        description={t("questionBank.trash.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmRowTrash}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={onConfirmBulkOpenChange}
        title={
          showDeleted
            ? t("questionBank.trash.restore")
            : t("questionBank.trash.deleteTitle")
        }
        description={t(
          showDeleted
            ? "questionBank.trash.bulkRestoreConfirm"
            : "questionBank.trash.bulkDeleteConfirm",
          { count: selectedCount },
        )}
        confirmLabel={
          showDeleted ? t("questionBank.trash.restore") : t("common.delete")
        }
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmBulkTrash}
      />
    </>
  );
}
