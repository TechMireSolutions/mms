import type React from "react";
import { Trash2 } from "lucide-react";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import {
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
} from "@/components/ui/BulkSelectionActions";
import { useTranslation } from "@/hooks/useTranslation";

interface InvoiceListSelectionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  onRequestBulkAction: () => void;
}

export function InvoiceListSelectionBar({
  selectedCount,
  showDeleted,
  onRequestBulkAction,
}: InvoiceListSelectionBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BulkSelectionBar
      placement="inline"
      tone="plain"
      selectedCount={selectedCount}
      countLabel={t("finance.trash.selected", { count: selectedCount })}
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
