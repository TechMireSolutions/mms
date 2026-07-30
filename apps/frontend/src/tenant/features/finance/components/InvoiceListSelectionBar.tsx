import type React from "react";
import { RotateCcw, Trash2 } from "lucide-react";
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
}: InvoiceListSelectionBarProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium">{t("finance.trash.selected", { count: selectedCount })}</span>
      <Button type="button" variant={showDeleted ? "outline" : "destructive"} onClick={onRequestBulkAction}>
        {showDeleted ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
        {showDeleted ? t("finance.trash.restore") : t("common.delete")}
      </Button>
    </div>
  );
}
