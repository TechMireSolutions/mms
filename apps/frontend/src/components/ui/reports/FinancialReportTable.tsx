import React, { useMemo } from "react";
import { DollarSign } from "lucide-react";
import { formatDate } from "@mms/shared";
import type { Invoice } from "@/lib/data/financeData";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
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

export const FinancialInvoiceTable = React.memo(function FinancialInvoiceTable({ invoices }: FinancialInvoiceTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const statusConfig = useMemo(() => ({
    paid: { label: t("finance.invoiceStatus.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("finance.invoiceStatus.pending"), cls: SEMANTIC_BADGE.warning },
    overdue: { label: t("finance.invoiceStatus.overdue"), cls: SEMANTIC_BADGE.destructive },
    partial: { label: t("finance.invoiceStatus.partial"), cls: SEMANTIC_BADGE.info },
    cancelled: { label: t("finance.invoiceStatus.cancelled"), cls: SEMANTIC_BADGE.muted },
  }), [t]);
  const headers = useMemo(() => [
    { key: "invoice", label: t("finance.columns.invoice") },
    { key: "student", label: t("finance.columns.student") },
    { key: "class", label: t("finance.report.classColumn") },
    { key: "baseFee", label: t("finance.columns.baseFee") },
    { key: "discount", label: t("finance.columns.discount") },
    { key: "final", label: t("finance.columns.final") },
    { key: "dueDate", label: t("finance.columns.dueDate") },
    { key: "status", label: t("finance.columns.status") },
  ], [t]);
  const exportHeaders = useMemo(() => headers.map((header) => header.label), [headers]);

  return (
    <>
      <ExportToolbar title={t("finance.report.invoiceReportTitle")} data={invoices} headers={exportHeaders} />
      {invoices.length === 0 ? (
        <EmptyState icon={DollarSign} title={t("finance.report.noInvoicesMatch")} compact />
      ) : (
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {invoices.map((invoice) => (
              <article key={invoice.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div>
                    <h4 className="truncate text-sm font-semibold text-foreground">{invoice.studentName}</h4>
                    <p className="text-xs text-muted-foreground">{invoice.id} • {invoice.class}</p>
                  </div>
                  <StatusBadge status={invoice.status} config={statusConfig} />
                </div>
                <StatGrid>
                  <StatRow className="min-w-0" label={t("finance.columns.baseFee")} value={formatCurrency(invoice.baseFee)} />
                  {invoice.discountAmt > 0 ? (
                    <StatRow
                      className="min-w-0"
                      label={t("finance.columns.discount")}
                      value={`-${formatCurrency(invoice.discountAmt)} (${invoice.discountType || "discount"})`}
                      ddClassName="text-destructive font-medium"
                    />
                  ) : null}
                  <StatRow
                    className="min-w-0"
                    label={t("finance.columns.final")}
                    value={formatCurrency(invoice.finalAmt)}
                    ddClassName="font-semibold text-foreground"
                  />
                  <StatRow className="min-w-0" label={t("finance.columns.dueDate")} value={formatDate(invoice.dueDate)} />
                </StatGrid>
              </article>
            ))}
          </div>
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("finance.report.invoiceReportTitle")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  {headers.map((header) => (
                    <ModuleTableHeaderCell key={header.key} columnKey={header.key} className="px-3 py-2.5">
                      {header.label}
                    </ModuleTableHeaderCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-3 py-2.5 font-medium text-foreground">{invoice.id}</TableCell>
                    <TableCell className="px-3 py-2.5 font-medium text-foreground">{invoice.studentName}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{invoice.class}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{formatCurrency(invoice.baseFee)}</TableCell>
                    <TableCell className="px-3 py-2.5 text-destructive">
                      {invoice.discountAmt > 0 ? `-${formatCurrency(invoice.discountAmt)}` : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 font-semibold text-foreground">{formatCurrency(invoice.finalAmt)}</TableCell>
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <StatusBadge status={invoice.status} config={statusConfig} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </>
  );
});

export const FinancialDashboardWidgets = React.memo(function FinancialDashboardWidgets(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="border-t border-border/50 pt-6 mt-6 space-y-4 text-start">
      <div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t("finance.report.dashboardWidgetsTitle")}</h3>
        <SectionLabel as="p" weight="bold" tracking="wider" className="mt-0.5">
          {t("finance.report.dashboardWidgetsSubtitle")}
        </SectionLabel>
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
});
