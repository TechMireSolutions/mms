import type { ReactElement } from "react";
import { ReceiptText } from "lucide-react";
import { FINANCE_MODULE_MANIFEST } from "@mms/shared";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import { useTranslation } from "@/hooks/useTranslation";

export interface FinanceBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
}

/** Finance invoices Work bulk bar — Enrollments-shaped composition over shared ModuleWorkBulkActionBar. */
export function FinanceBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions = FINANCE_MODULE_MANIFEST.work.bulkActions,
}: FinanceBulkActionBarProps): ReactElement {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t("finance.trash.selected", { count: selectedCount })}
      leading={<ReceiptText className="w-4 h-4 text-primary" aria-hidden />}
      deselectLabel={t("common.deselect")}
      canDelete={canDelete}
      restoreLabel={t("finance.trash.restore")}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      deleteAction={
        bulkActions.includes("delete") && canDelete
          ? { label: t("common.delete"), onClick: onRequestBulkDelete }
          : undefined
      }
    />
  );
}
