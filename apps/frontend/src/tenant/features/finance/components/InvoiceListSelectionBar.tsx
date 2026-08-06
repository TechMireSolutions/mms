import type React from "react";
import { Trash2 } from "lucide-react";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionClearAction,
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
} from "@/components/ui/BulkSelectionActions";
import { useTranslation } from "@/hooks/useTranslation";

interface InvoiceListSelectionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  onRequestBulkAction: () => void;
  onClearSelection: () => void;
}

export function InvoiceListSelectionBar({
  selectedCount,
  showDeleted,
  onRequestBulkAction,
  onClearSelection,
}: InvoiceListSelectionBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BulkSelectionBar
      placement="inline"
      tone="glass"
      selectedCount={selectedCount}
      countLabel={t("finance.trash.selected", { count: selectedCount })}
      trailing={
        <BulkSelectionClearAction
          label={t("common.deselect")}
          onClick={onClearSelection}
        />
      }
    >
      {showDeleted ? (
        <BulkSelectionRestoreAction
          label={t("finance.trash.restore")}
          onClick={onRequestBulkAction}
        />
      ) : (
        <BulkSelectionDeleteAction
          label={t("common.delete")}
          onClick={onRequestBulkAction}
          icon={Trash2}
        />
      )}
    </BulkSelectionBar>
  );
}
