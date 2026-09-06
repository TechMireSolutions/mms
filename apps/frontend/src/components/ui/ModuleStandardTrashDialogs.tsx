import React, { type JSX } from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";
import type { AppTranslationKey } from "@mms/shared";

export interface ModuleStandardTrashDialogsProps {
  pendingTrashId: string | null;
  onPendingTrashIdChange: (id: string | null) => void;
  confirmBulkOpen: boolean;
  onConfirmBulkOpenChange: (open: boolean) => void;
  showDeleted?: boolean;
  selectedCount: number;
  i18nNamespace: string;
  onConfirmRowTrash: () => void | Promise<void>;
  onConfirmBulkTrash: () => void | Promise<void>;
  labels?: {
    singleTitle?: string;
    singleDescription?: string;
    singleConfirm?: string;
    bulkDeleteTitle?: string;
    bulkDeleteDescription?: string;
    bulkRestoreTitle?: string;
    bulkRestoreDescription?: string;
    bulkDeleteConfirm?: string;
    bulkRestoreConfirm?: string;
    cancel?: string;
  };
}

/** Standard dual-dialog trash confirm (single delete + bulk delete/restore) for modules without deletion reasons. */
export function ModuleStandardTrashDialogs({
  pendingTrashId,
  onPendingTrashIdChange,
  confirmBulkOpen,
  onConfirmBulkOpenChange,
  showDeleted = false,
  selectedCount,
  i18nNamespace,
  onConfirmRowTrash,
  onConfirmBulkTrash,
  labels,
}: ModuleStandardTrashDialogsProps): JSX.Element {
  const { t } = useTranslation();

  const singleTitle = labels?.singleTitle ?? t(`${i18nNamespace}.trash.deleteTitle` as AppTranslationKey);
  const singleDescription = labels?.singleDescription ?? t(`${i18nNamespace}.trash.deleteConfirm` as AppTranslationKey);
  const singleConfirm = labels?.singleConfirm ?? t("common.delete");
  const cancelLabel = labels?.cancel ?? t("common.cancel");

  const bulkTitle = showDeleted
    ? (labels?.bulkRestoreTitle ?? t(`${i18nNamespace}.trash.restore` as AppTranslationKey))
    : (labels?.bulkDeleteTitle ?? t(`${i18nNamespace}.trash.deleteTitle` as AppTranslationKey));

  const bulkDescription = showDeleted
    ? (labels?.bulkRestoreDescription ?? t(`${i18nNamespace}.trash.bulkRestoreConfirm` as AppTranslationKey, { count: selectedCount }))
    : (labels?.bulkDeleteDescription ?? t(`${i18nNamespace}.trash.bulkDeleteConfirm` as AppTranslationKey, { count: selectedCount }));

  const bulkConfirm = showDeleted
    ? (labels?.bulkRestoreConfirm ?? t(`${i18nNamespace}.trash.restore` as AppTranslationKey))
    : (labels?.bulkDeleteConfirm ?? t("common.delete"));

  return (
    <>
      <ConfirmAlertDialog
        open={pendingTrashId !== null}
        onOpenChange={(open) => {
          if (!open) onPendingTrashIdChange(null);
        }}
        title={singleTitle}
        description={singleDescription}
        confirmLabel={singleConfirm}
        cancelLabel={cancelLabel}
        onConfirm={onConfirmRowTrash}
        destructive
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={onConfirmBulkOpenChange}
        title={bulkTitle}
        description={bulkDescription}
        confirmLabel={bulkConfirm}
        cancelLabel={cancelLabel}
        onConfirm={onConfirmBulkTrash}
        destructive={!showDeleted}
      />
    </>
  );
}
