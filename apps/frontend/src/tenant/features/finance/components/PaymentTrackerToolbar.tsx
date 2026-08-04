import { CreditCard, RotateCcw, Trash2 } from "lucide-react";

import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";

interface PaymentMethodSummaryProps {
  paymentsByMethod: Record<string, { amount: number; count: number }>;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
}

export function PaymentMethodSummary({
  paymentsByMethod,
  methodConfig,
  formatCurrency,
}: PaymentMethodSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={t("finance.paymentsByMethod")}>
      {Object.entries(paymentsByMethod).map(([method, summary]) => (
        <Card key={method} className="p-3">
          <StatusBadge status={method} config={methodConfig} size="sm" />
          <p className="m-0 mt-2 text-base font-bold text-foreground">{formatCurrency(summary.amount)}</p>
          <p className="m-0 text-xs text-muted-foreground">
            {t("finance.paymentCount", { count: summary.count })}
          </p>
        </Card>
      ))}
    </div>
  );
}

interface PaymentSelectionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  onOpenBulkConfirm: () => void;
}

export function PaymentSelectionBar({
  selectedCount,
  showDeleted,
  onOpenBulkConfirm,
}: PaymentSelectionBarProps) {
  const { t } = useTranslation();

  return (
    <BulkSelectionBar
      placement="inline"
      tone="plain"
      selectedCount={selectedCount}
      countLabel={t("finance.trash.selected", { count: selectedCount })}
    >
      <Button type="button" variant={showDeleted ? "outline" : "destructive"} onClick={onOpenBulkConfirm}>
        {showDeleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
        {showDeleted ? t("finance.trash.restore") : t("common.delete")}
      </Button>
    </BulkSelectionBar>
  );
}

interface PaymentLogHeaderProps {
  totalPaid: number;
  formatCurrency: (amount: number) => string;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function PaymentLogHeader({
  totalPaid,
  formatCurrency,
  columnCustomizer,
}: PaymentLogHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/20 px-4 py-3 ps-6.5">
      <div className="flex min-w-0 items-center gap-2">
        <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <h3 className="m-0 text-sm font-bold text-foreground">{t("finance.paymentLog")}</h3>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-success">
          {t("finance.paymentTotal", { amount: formatCurrency(totalPaid) })}
        </span>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </div>
    </header>
  );
}
