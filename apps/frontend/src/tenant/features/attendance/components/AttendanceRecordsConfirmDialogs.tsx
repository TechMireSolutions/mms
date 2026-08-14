import React from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface AttendanceRecordsConfirmDialogsProps {
  pendingDeleteId: string | null;
  onPendingDeleteChange: (id: string | null) => void;
  onConfirmDelete: (id: string) => void;
  confirmBulkOpen: boolean;
  onConfirmBulkOpenChange: (open: boolean) => void;
  showDeleted: boolean;
  selectedIdsCount: number;
  onConfirmBulkTrash: () => void;
  t: TranslationFunction;
}

export function AttendanceRecordsConfirmDialogs({
  pendingDeleteId,
  onPendingDeleteChange,
  onConfirmDelete,
  confirmBulkOpen,
  onConfirmBulkOpenChange,
  showDeleted,
  selectedIdsCount,
  onConfirmBulkTrash,
  t,
}: AttendanceRecordsConfirmDialogsProps): React.JSX.Element {
  return (
    <>
      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => {
          if (!open) onPendingDeleteChange(null);
        }}
        title={t("attendance.confirmArchiveTitle")}
        description={t("attendance.confirmArchiveDescription")}
        confirmLabel={t("attendance.archive")}
        onConfirm={() => {
          const id = pendingDeleteId;
          onPendingDeleteChange(null);
          if (id) onConfirmDelete(id);
        }}
        destructive
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={onConfirmBulkOpenChange}
        title={showDeleted ? t("attendance.trash.restore") : t("attendance.confirmArchiveTitle")}
        description={t(
          showDeleted ? "attendance.trash.bulkRestoreConfirm" : "attendance.trash.bulkDeleteConfirm",
          { count: selectedIdsCount }
        )}
        confirmLabel={showDeleted ? t("attendance.trash.restore") : t("common.delete")}
        onConfirm={onConfirmBulkTrash}
        destructive={!showDeleted}
      />
    </>
  );
}
