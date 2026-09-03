import React from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";

export interface HasanatTrashDialogsProps {
  pendingTrashId: string | null;
  onPendingTrashIdChange: (id: string | null) => void;
  confirmBulkOpen: boolean;
  onConfirmBulkOpenChange: (open: boolean) => void;
  showDeleted: boolean;
  selectedCount: number;
  onConfirmRowTrash: () => void;
  onConfirmBulkTrash: () => void;
}

export function HasanatTrashDialogs({
  pendingTrashId,
  onPendingTrashIdChange,
  confirmBulkOpen,
  onConfirmBulkOpenChange,
  showDeleted,
  selectedCount,
  onConfirmRowTrash,
  onConfirmBulkTrash,
}: HasanatTrashDialogsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ConfirmAlertDialog
        open={pendingTrashId !== null}
        onOpenChange={(open) => {
          if (!open) onPendingTrashIdChange(null);
        }}
        title={t("hasanat.trash.deleteTitle")}
        description={t("hasanat.trash.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmRowTrash}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={onConfirmBulkOpenChange}
        title={
          showDeleted
            ? t("hasanat.trash.restore")
            : t("hasanat.trash.deleteTitle")
        }
        description={t(
          showDeleted
            ? "hasanat.trash.bulkRestoreConfirm"
            : "hasanat.trash.bulkDeleteConfirm",
          { count: selectedCount },
        )}
        confirmLabel={
          showDeleted ? t("hasanat.trash.restore") : t("common.delete")
        }
        cancelLabel={t("common.cancel")}
        onConfirm={onConfirmBulkTrash}
      />
    </>
  );
}
