import React from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";

export interface ExaminationsTrashDialogsProps {
  pendingTrashId: string | null;
  onPendingTrashIdChange: (id: string | null) => void;
  confirmBulkOpen: boolean;
  onConfirmBulkOpenChange: (open: boolean) => void;
  showDeleted: boolean;
  selectedCount: number;
  onConfirmRowTrash: () => void;
  onConfirmBulkTrash: () => void;
}

export function ExaminationsTrashDialogs({
  pendingTrashId,
  onPendingTrashIdChange,
  confirmBulkOpen,
  onConfirmBulkOpenChange,
  showDeleted,
  selectedCount,
  onConfirmRowTrash,
  onConfirmBulkTrash,
}: ExaminationsTrashDialogsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmAlertDialog
        open={pendingTrashId !== null}
        onOpenChange={(open) => {
          if (!open) onPendingTrashIdChange(null);
        }}
        title={t("examinations.trash.deleteTitle")}
        description={t("examinations.trash.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmRowTrash}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={onConfirmBulkOpenChange}
        title={showDeleted ? t("examinations.trash.restore") : t("examinations.trash.deleteTitle")}
        description={t(
          showDeleted
            ? "examinations.trash.bulkRestoreConfirm"
            : "examinations.trash.bulkDeleteConfirm",
          { count: selectedCount },
        )}
        confirmLabel={showDeleted ? t("examinations.trash.restore") : t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmBulkTrash}
      />
    </>
  );
}
