import { ModuleSoftDeleteConfirmDialogs } from "@/components/ui/ModuleSoftDeleteConfirmDialogs";
import { useTranslation } from "@/hooks/useTranslation";
import type { TeachersDeleteTarget } from "@/tenant/features/teachers/hooks/useTeachersPageOverlayState";

export interface TeachersPageConfirmDialogsProps {
  bulkDeleteOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirmBulkDelete: (reason?: string) => void | Promise<void>;
  deleteTarget: TeachersDeleteTarget | null;
  onDeleteTargetOpenChange: (open: boolean) => void;
  onConfirmSingleDelete: (reason?: string) => void | Promise<void>;
  bulkRestoreOpen: boolean;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onConfirmBulkRestore: () => void | Promise<void>;
}

/** Delete/restore confirm dialogs for Teachers page (Contacts-shaped thin adapter). */
export function TeachersPageConfirmDialogs({
  bulkDeleteOpen,
  onBulkDeleteOpenChange,
  selectedCount,
  onConfirmBulkDelete,
  deleteTarget,
  onDeleteTargetOpenChange,
  onConfirmSingleDelete,
  bulkRestoreOpen,
  onBulkRestoreOpenChange,
  onConfirmBulkRestore,
}: TeachersPageConfirmDialogsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleSoftDeleteConfirmDialogs
      pendingDeleteOpen={deleteTarget !== null}
      onPendingDeleteOpenChange={onDeleteTargetOpenChange}
      bulkDeleteOpen={bulkDeleteOpen}
      onBulkDeleteOpenChange={onBulkDeleteOpenChange}
      bulkRestoreOpen={bulkRestoreOpen}
      onBulkRestoreOpenChange={onBulkRestoreOpenChange}
      singleDeleteTitle={t("teachers.confirmDeleteTitle")}
      singleDeleteDescription={
        deleteTarget?.name
          ? t("teachers.deleteConfirmDescriptionNamed", { name: deleteTarget.name })
          : t("teachers.confirmDeleteDescription")
      }
      bulkDeleteTitle={t("teachers.bulkDelete")}
      bulkDeleteDescription={t("teachers.bulkDeleteConfirm", { count: selectedCount })}
      bulkRestoreTitle={t("teachers.bulkRestore")}
      bulkRestoreDescription={t("teachers.bulkRestoreConfirm", { count: selectedCount })}
      deleteConfirmLabel={t("common.delete")}
      restoreConfirmLabel={t("teachers.restore")}
      cancelLabel={t("common.cancel")}
      deletionReasonLabel={t("teachers.deletionReasonLabel")}
      deletionReasonPlaceholder={t("teachers.deletionReasonPlaceholder")}
      onConfirmSingleDelete={onConfirmSingleDelete}
      onConfirmBulkDelete={onConfirmBulkDelete}
      onConfirmBulkRestore={onConfirmBulkRestore}
    />
  );
}
