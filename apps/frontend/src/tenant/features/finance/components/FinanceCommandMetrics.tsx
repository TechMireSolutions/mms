import React from "react";
import { ReceiptText, AlertTriangle, CheckCircle2, Clock, CreditCard, PieChart } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceMetrics } from "@/tenant/features/finance/hooks/useFinanceColumnPreferences";
import { ModuleCommandMetricCard } from "@/components/ui/ModuleCommandMetricCard";

interface FinanceCommandMetricsProps {
  invoiceTotal: number;
}

export function FinanceCommandMetrics({
  invoiceTotal,
}: FinanceCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: serverMetrics } = useFinanceMetrics();

  const metrics = {
    totalInvoices: serverMetrics?.totalInvoices ?? invoiceTotal,
    outstanding: serverMetrics?.outstanding ?? 0,
    overdue: serverMetrics?.overdue ?? 0,
    paid: serverMetrics?.paid ?? 0,
    partial: serverMetrics?.partial ?? 0,
    totalPayments: serverMetrics?.totalPayments ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <ModuleCommandMetricCard icon={ReceiptText} label={t("finance.metrics.totalInvoices")} value={metrics.totalInvoices} />
      <ModuleCommandMetricCard icon={Clock} label={t("finance.metrics.outstanding")} value={metrics.outstanding} />
      <ModuleCommandMetricCard icon={AlertTriangle} label={t("finance.metrics.overdue")} value={metrics.overdue} />
      <ModuleCommandMetricCard icon={PieChart} label={t("finance.metrics.partial")} value={metrics.partial} />
      <ModuleCommandMetricCard icon={CheckCircle2} label={t("finance.metrics.paid")} value={metrics.paid} />
      <ModuleCommandMetricCard icon={CreditCard} label={t("finance.metrics.totalPayments")} value={metrics.totalPayments} />
    </div>
  );
}
