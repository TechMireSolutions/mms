import React from "react";
import { X, CheckCircle2, Clock, AlertCircle, ReceiptText, User, Calendar, CreditCard } from "lucide-react";
import { Invoice } from '@/lib/data/financeData';
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

import { useTranslation } from "@/hooks/useTranslation";
import { formatDate } from "@mms/shared";
import { useFinanceCurrency } from "../hooks/useFinanceCurrency";

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onRecord: (invoice: Invoice) => void;
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
export function InvoiceDetail({ invoice, onClose, onRecord }: InvoiceDetailProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();

  const statusConfig = React.useMemo(() => {
    const config: Record<string, { label: string, className: string, icon: React.ElementType }> = {
      paid:      { label: t("finance.invoiceStatus.paid"),      className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
      pending:   { label: t("finance.invoiceStatus.pending"),   className: "bg-warning/10 text-warning border-warning/20",       icon: Clock },
      overdue:   { label: t("finance.invoiceStatus.overdue"),   className: "bg-destructive/10 text-destructive border-destructive/20",             icon: AlertCircle },
      partial:   { label: t("finance.invoiceStatus.partial"),   className: "bg-info/10 text-info border-info/20",          icon: Clock },
      cancelled: { label: t("finance.invoiceStatus.cancelled"), className: "bg-muted text-muted-foreground border-border",      icon: X },
    };
    return config[invoice.status] || config.pending;
  }, [invoice.status, t]);

  const StatusIcon = statusConfig.icon;

  const rows = [
    { label: "Base Fee", value: formatCurrency(invoice.baseFee), highlight: false, neg: false },
    ...(invoice.discountAmt > 0 ? [{ label: `Discount (${invoice.discountType} – ${invoice.discountValue}%)`, value: `– ${formatCurrency(invoice.discountAmt)}`, highlight: false, neg: true }] : []),
    { label: "Final Amount", value: formatCurrency(invoice.finalAmt), highlight: true, neg: false },
    ...(invoice.paidAmt ? [{ label: "Amount Paid", value: formatCurrency(invoice.paidAmt), highlight: false, neg: false }] : []),
    ...(invoice.paidAmt && invoice.paidAmt < invoice.finalAmt ? [{ label: "Balance Due", value: formatCurrency(invoice.finalAmt - invoice.paidAmt), highlight: false, neg: true }] : []),
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={`Invoice ${invoice.id}`}
      icon={ReceiptText}
      size="sm"
      footer={
        invoice.status !== "paid" && invoice.status !== "cancelled" ? (
          <Button
            onClick={() => { onRecord(invoice); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <ReceiptText className="w-4 h-4" aria-hidden="true" /> Record Payment
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        {/* Status badge */}
        <div className="flex items-center justify-between" aria-label={`Invoice Status: ${statusConfig.label}`}>
          <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusConfig.className}`}>
            <StatusIcon className="w-3 h-3" aria-hidden="true" /> {statusConfig.label}
          </span>
          <span className="text-[11px] text-muted-foreground">Due: {formatDate(invoice.dueDate)}</span>
        </div>

        {/* Student & session info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-[13px]">
            <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="font-semibold text-foreground">{invoice.studentName}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{invoice.class} · {invoice.session}</span>
          </div>
        </div>

        {/* Fee breakdown */}
        <article className="relative overflow-hidden group/breakdown rounded-xl border border-border bg-card/45 backdrop-blur-xs shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60" />
          <header className="px-4 py-2 bg-muted/30 border-b border-border pl-5">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide m-0">Fee Breakdown</h4>
          </header>
          <div className="divide-y divide-border/50">
            {rows.map((row) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-2.5 ${row.highlight ? "bg-primary/5" : ""}`}>
                <span className={`text-[12px] ${row.highlight ? "font-bold text-foreground" : "text-muted-foreground"}`}>{row.label}</span>
                <span className={`text-[13px] font-bold ${row.highlight ? "text-primary" : row.neg ? "text-destructive" : "text-foreground"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </article>

        {/* Payment info */}
        {invoice.paidDate && (
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
            <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Paid on {invoice.paidDate} via {invoice.method}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
