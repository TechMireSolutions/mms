import { CreditCard, Trash2 } from "lucide-react";

import {
  BulkActionDock,
  BulkSelectionDeleteAction,
  BulkSelectionRestoreAction,
} from "@/components/common/BulkActionDock";
import { Card } from "@/components/ui/card";
import { CardTitleBar } from "@/components/ui/CardTitleBar";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";

export interface PaymentMethodSummaryProps {
  paymentsByMethod: Record<string, { amount: number; count: number }>;
  methodConfig: Record<string, StatusBadgeConfigItem>;
  formatCurrency: (amount: number) => string;
}

export function PaymentMethodSummary({
  paymentsByMethod,
  methodConfig,
  formatCurrency,
}: PaymentMethodSummaryProps): React.JSX.Element {
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

export interface PaymentSelectionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  onOpenBulkConfirm: () => void;
}

export function PaymentSelectionBar({
  selectedCount,
  showDeleted,
  onOpenBulkConfirm,
}: PaymentSelectionBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BulkActionDock
      placement="inline"
      tone="plain"
      selectedCount={selectedCount}
      countLabel={t("finance.trash.selected", { count: selectedCount })}
      onClearSelection={() => {}}
      enableEscapeKey={false}
    >
      {showDeleted ? (
        <BulkSelectionRestoreAction
          label={t("finance.trash.restore")}
          onClick={onOpenBulkConfirm}
        />
      ) : (
        <BulkSelectionDeleteAction
          label={t("common.delete")}
          onClick={onOpenBulkConfirm}
          icon={Trash2}
        />
      )}
    </BulkActionDock>
  );
}

export interface PaymentLogHeaderProps {
  totalPaid: number;
  formatCurrency: (amount: number) => string;
  columnCustomizer?: ModuleColumnCustomizerProps;
}

export function PaymentLogHeader({
  totalPaid,
  formatCurrency,
  columnCustomizer,
}: PaymentLogHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <CardTitleBar
      inset
      icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
      title={t("finance.paymentLog")}
      actions={
        <>
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
        </>
      }
    />
  );
}
