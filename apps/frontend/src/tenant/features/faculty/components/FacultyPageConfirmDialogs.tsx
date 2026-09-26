import { ModuleSoftDeleteConfirmDialogs } from "@/components/ui/ModuleSoftDeleteConfirmDialogs";
import { useTranslation } from "@/hooks/useTranslation";
import type { TeachersDeleteTarget } from "@/tenant/features/faculty/hooks/useFacultyPageOverlayState";

export interface FacultyPageConfirmDialogsProps {
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
export type TeachersPageConfirmDialogsProps = FacultyPageConfirmDialogsProps;

/** Delete/restore confirm dialogs for Faculty page (Contacts-shaped thin adapter). */
export function FacultyPageConfirmDialogs({
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
}: FacultyPageConfirmDialogsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleSoftDeleteConfirmDialogs
      pendingDeleteOpen={deleteTarget !== null}
      onPendingDeleteOpenChange={onDeleteTargetOpenChange}
      bulkDeleteOpen={bulkDeleteOpen}
      onBulkDeleteOpenChange={onBulkDeleteOpenChange}
      bulkRestoreOpen={bulkRestoreOpen}
      onBulkRestoreOpenChange={onBulkRestoreOpenChange}
      singleDeleteTitle={t("faculty.confirmDeleteTitle") || t("teachers.confirmDeleteTitle")}
      singleDeleteDescription={
        deleteTarget?.name
          ? (t("faculty.deleteConfirmDescriptionNamed", { name: deleteTarget.name }) || t("teachers.deleteConfirmDescriptionNamed", { name: deleteTarget.name }))
          : (t("faculty.confirmDeleteDescription") || t("teachers.confirmDeleteDescription"))
      }
      bulkDeleteTitle={t("faculty.bulkDelete") || t("teachers.bulkDelete")}
      bulkDeleteDescription={t("faculty.bulkDeleteConfirm", { count: selectedCount }) || t("teachers.bulkDeleteConfirm", { count: selectedCount })}
      bulkRestoreTitle={t("faculty.bulkRestore") || t("teachers.bulkRestore")}
      bulkRestoreDescription={t("faculty.bulkRestoreConfirm", { count: selectedCount }) || t("teachers.bulkRestoreConfirm", { count: selectedCount })}
      deleteConfirmLabel={t("common.delete")}
      restoreConfirmLabel={t("faculty.restore") || t("teachers.restore")}
      cancelLabel={t("common.cancel")}
      deletionReasonLabel={t("faculty.deletionReasonLabel") || t("teachers.deletionReasonLabel")}
      deletionReasonPlaceholder={t("faculty.deletionReasonPlaceholder") || t("teachers.deletionReasonPlaceholder")}
      onConfirmSingleDelete={onConfirmSingleDelete}
      onConfirmBulkDelete={onConfirmBulkDelete}
      onConfirmBulkRestore={onConfirmBulkRestore}
    />
  );
}

export const TeachersPageConfirmDialogs = FacultyPageConfirmDialogs;


