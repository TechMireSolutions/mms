import React from "react";
import { ReceiptText, User, Calendar, CreditCard } from "lucide-react";
import { Invoice } from '@/lib/data/financeData';
import { Button } from "@/components/ui/button";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

import { useTranslation } from "@/hooks/useTranslation";
import { formatDate } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onRecord: (invoice: Invoice) => void;
  canWrite?: boolean;
}

/**
 * InvoiceDetail Component
 * 
 * Displays detailed information about a specific invoice, including fee breakdown
 * and payment status.
 * 
 * @param {InvoiceDetailProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function InvoiceDetail({ invoice, onClose, onRecord, canWrite = true }: InvoiceDetailProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();

  const statusConfig = React.useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    paid: { label: t("finance.invoiceStatus.paid"), cls: SEMANTIC_BADGE.success },
    pending: { label: t("finance.invoiceStatus.pending"), cls: SEMANTIC_BADGE.warning },
    overdue: { label: t("finance.invoiceStatus.overdue"), cls: SEMANTIC_BADGE.destructive },
    partial: { label: t("finance.invoiceStatus.partial"), cls: SEMANTIC_BADGE.info },
    cancelled: { label: t("finance.invoiceStatus.cancelled"), cls: SEMANTIC_BADGE.muted },
  }), [t]);

  const rows = [
    { label: t("finance.columns.baseFee"), value: formatCurrency(invoice.baseFee), highlight: false, neg: false },
    ...(invoice.discountAmt > 0 ? [{ label: t("finance.detail.discount", { type: invoice.discountType ?? t("common.none"), value: invoice.discountValue }), value: `– ${formatCurrency(invoice.discountAmt)}`, highlight: false, neg: true }] : []),
    { label: t("finance.form.finalAmount"), value: formatCurrency(invoice.finalAmt), highlight: true, neg: false },
    ...(invoice.paidAmt ? [{ label: t("finance.detail.amountPaid"), value: formatCurrency(invoice.paidAmt), highlight: false, neg: false }] : []),
    ...(invoice.paidAmt && invoice.paidAmt < invoice.finalAmt ? [{ label: t("finance.balanceDue"), value: formatCurrency(invoice.finalAmt - invoice.paidAmt), highlight: false, neg: true }] : []),
  ];

  return (
    <DetailDrawerShell
      open
      onClose={onClose}
      title={t("finance.detail.title", { id: invoice.id })}
      icon={ReceiptText}
      className="max-w-2xl"
      footer={
        canWrite && invoice.status !== "paid" && invoice.status !== "cancelled" ? (
          <Button
            onClick={() => { onRecord(invoice); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <ReceiptText className="w-4 h-4" aria-hidden="true" /> {t("finance.recordPayment")}
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between" aria-label={t("finance.detail.status", { status: statusConfig[invoice.status]?.label ?? invoice.status })}>
          <StatusBadge status={invoice.status} config={statusConfig} size="sm" />
          <span className="text-xs text-muted-foreground">{t("finance.detail.due", { date: formatDate(invoice.dueDate) })}</span>
        </div>

        {/* Student & session info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold text-foreground">{invoice.studentName}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{invoice.class} · {invoice.session}</span>
          </div>
        </div>

        {/* Fee breakdown */}
        <article className="relative overflow-hidden group/breakdown rounded-xl border border-border bg-card/45 backdrop-blur-xs shadow-sm">
          <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/60" />
          <header className="px-4 py-2 bg-muted/30 border-b border-border ps-5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide m-0">{t("finance.detail.breakdown")}</h4>
          </header>
          <div className="divide-y divide-border/50">
            {rows.map((row) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-2.5 ${row.highlight ? "bg-primary/5" : ""}`}>
                <span className={`text-sm ${row.highlight ? "font-bold text-foreground" : "text-muted-foreground"}`}>{row.label}</span>
                <span className={`text-sm font-bold ${row.highlight ? "text-primary" : row.neg ? "text-destructive" : "text-foreground"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </article>

        {/* Payment info */}
        {invoice.paidDate && (
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("finance.detail.paidVia", { date: formatDate(invoice.paidDate), method: invoice.method ?? t("common.none") })}</span>
          </div>
        )}
      </div>
    </DetailDrawerShell>
  );
}
