import type { ReactElement } from "react";
import { ClipboardList, XCircle } from "lucide-react";
import { ENROLLMENTS_MODULE_MANIFEST } from "@mms/shared";
import { bulkSelectionActionClassName } from "@/components/ui/BulkSelectionBar";
import { Button } from "@/components/ui/button";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import { useTranslation } from "@/hooks/useTranslation";

export interface EnrollmentsBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  canCancel: boolean;
  canExport?: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onRequestBulkCancel: () => void;
  onClearSelection: () => void;
  onBulkExport?: () => void;
  bulkActions?: readonly string[];
}

/** Enrollments Work bulk bar — Sessions-shaped composition over shared ModuleWorkBulkActionBar. */
export function EnrollmentsBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  canCancel,
  canExport = false,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onRequestBulkCancel,
  onClearSelection,
  onBulkExport,
  bulkActions = ENROLLMENTS_MODULE_MANIFEST.work.bulkActions,
}: EnrollmentsBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t("enrollments.selectedCount", { count: selectedCount })}
      leading={<ClipboardList className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t("common.deselect")}
      canDelete={canDelete}
      restoreLabel={t("enrollments.restore")}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      exportAction={
        bulkActions.includes("export") && canExport && onBulkExport
          ? { label: t("enrollments.bulkExport"), onClick: onBulkExport }
          : undefined
      }
      extraActions={
        bulkActions.includes("cancel") && canCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRequestBulkCancel}
            className={bulkSelectionActionClassName}
          >
            <XCircle className="w-3.5 h-3.5 text-muted-foreground" aria-hidden /> {t("enrollments.bulkCancel")}
          </Button>
        ) : undefined
      }
      deleteAction={
        bulkActions.includes("delete") && canDelete
          ? { label: t("enrollments.archive"), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
