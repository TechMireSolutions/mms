import type React from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { Button } from "@/components/ui/button";
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
      <Button type="button" variant={showDeleted ? "outline" : "destructive"} onClick={onRequestBulkAction}>
        {showDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        {showDeleted ? t("finance.trash.restore") : t("common.delete")}
      </Button>
    </BulkSelectionBar>
  );
}
