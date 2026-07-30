import React from "react";
import { DollarSign } from "lucide-react";
import { formatDate } from "@mms/shared";
import type { Invoice } from "@/lib/data/financeData";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import FeeCollectionSummary from "@/components/dashboard-widgets/FeeCollectionSummary";
import OutstandingFeesTable from "@/components/dashboard-widgets/OutstandingFeesTable";
import OverdueObligationsWidget from "@/components/dashboard-widgets/OverdueObligationsWidget";
import RevenueChart from "@/components/dashboard-widgets/charts/RevenueChart";

interface FinancialInvoiceTableProps {
  invoices: Invoice[];
}

export function FinancialInvoiceTable({ invoices }: FinancialInvoiceTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const statusConfig = {
    paid: { label: t("finance.invoiceStatus.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("finance.invoiceStatus.pending"), cls: SEMANTIC_BADGE.warning },
    overdue: { label: t("finance.invoiceStatus.overdue"), cls: SEMANTIC_BADGE.destructive },
    partial: { label: t("finance.invoiceStatus.partial"), cls: SEMANTIC_BADGE.info },
    cancelled: { label: t("finance.invoiceStatus.cancelled"), cls: SEMANTIC_BADGE.muted },
  };
  const headers = [
    t("finance.columns.invoice"),
    t("finance.columns.student"),
    t("finance.report.classColumn"),
    t("finance.columns.baseFee"),
    t("finance.columns.discount"),
    t("finance.columns.final"),
    t("finance.columns.dueDate"),
    t("finance.columns.status"),
  ];

  return (
    <>
      <ExportToolbar title={t("finance.report.invoiceReportTitle")} data={invoices} headers={headers} />
      {invoices.length === 0 ? (
        <EmptyState icon={DollarSign} title={t("finance.report.noInvoicesMatch")} compact />
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {invoices.map((invoice) => (
              <article key={invoice.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-foreground">{invoice.studentName}</h4>
                    <p className="font-mono text-xs text-muted-foreground">{invoice.id}</p>
                  </div>
                  <StatusBadge status={invoice.status} config={statusConfig} />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.report.classColumn")}</dt>
                    <dd className="text-foreground">{invoice.class}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.dueDate")}</dt>
                    <dd className="text-muted-foreground">{formatDate(invoice.dueDate)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.baseFee")}</dt>
                    <dd className="text-muted-foreground">{formatCurrency(invoice.baseFee)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.discount")}</dt>
                    <dd className="text-warning">{invoice.discountAmt > 0 ? `-${formatCurrency(invoice.discountAmt)}` : "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground">{t("finance.columns.final")}</dt>
                    <dd className="text-base font-semibold text-foreground">{formatCurrency(invoice.finalAmt)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {headers.map((headerLabel) => (
                    <th key={headerLabel} className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {headerLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{invoice.id}</td>
                    <td className="px-3 py-2.5 font-medium">{invoice.studentName}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{invoice.class}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatCurrency(invoice.baseFee)}</td>
                    <td className="px-3 py-2.5 text-warning">{invoice.discountAmt > 0 ? `-${formatCurrency(invoice.discountAmt)}` : "—"}</td>
                    <td className="px-3 py-2.5 font-semibold text-foreground">{formatCurrency(invoice.finalAmt)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={invoice.status} config={statusConfig} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

export function FinancialDashboardWidgets(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-start">
      <div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("finance.report.dashboardWidgetsTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">
          {t("finance.report.dashboardWidgetsSubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart />
        <FeeCollectionSummary />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OutstandingFeesTable />
        <OverdueObligationsWidget />
      </div>
    </div>
  );
}
