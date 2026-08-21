import type { ReactElement } from "react";
import { Printer, ReceiptText } from "lucide-react";
import { FINANCE_MODULE_MANIFEST } from "@mms/shared";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import { BulkSelectionStatusAction } from "@/components/ui/BulkSelectionActions";
import { bulkSelectionActionClassName } from "@/components/ui/BulkSelectionBar";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

const INVOICE_STATUSES = ['paid', 'pending', 'overdue', 'partial', 'cancelled'] as const;

export interface FinanceBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  onBulkStatusChange?: (status: string) => void;
  onBulkPrintReceipts?: () => void;
  isBulkStatusPending?: boolean;
  statusBadgeConfig?: Record<string, StatusBadgeConfigItem>;
  bulkActions?: readonly string[];
}

/** Finance invoices Work bulk bar — status, print receipt, and delete actions. */
export function FinanceBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  onBulkStatusChange,
  onBulkPrintReceipts,
  isBulkStatusPending = false,
  statusBadgeConfig = {},
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
      extraActions={
        !showDeleted ? (
          <>
            {bulkActions.includes("status") && onBulkStatusChange && (
              <BulkSelectionStatusAction
                label={t("finance.bulkStatus")}
                statuses={[...INVOICE_STATUSES]}
                statusBadgeConfig={statusBadgeConfig}
                onSelectStatus={onBulkStatusChange}
                disabled={isBulkStatusPending}
              />
            )}
            {bulkActions.includes("receipts") && onBulkPrintReceipts && (
              <Button
                type="button"
                variant="outline"
                onClick={onBulkPrintReceipts}
                className={bulkSelectionActionClassName}
              >
                <Printer className="w-3.5 h-3.5" aria-hidden /> {t("finance.printReceipts")}
              </Button>
            )}
          </>
        ) : undefined
      }
    />
  );
}
