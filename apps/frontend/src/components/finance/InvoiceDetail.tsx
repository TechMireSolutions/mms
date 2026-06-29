import React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Clock, AlertCircle, ReceiptText, User, Calendar, CreditCard } from "lucide-react";
import { Invoice } from '@/lib/data/financeData';
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<string, { label: string, className: string, icon: React.ElementType }> = {
  paid:      { label: "Paid",      className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  pending:   { label: "Pending",   className: "bg-warning/10 text-warning border-warning/20",       icon: Clock },
  overdue:   { label: "Overdue",   className: "bg-destructive/10 text-destructive border-destructive/20",             icon: AlertCircle },
  partial:   { label: "Partial",   className: "bg-info/10 text-info border-info/20",          icon: Clock },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border",      icon: X },
};

const formatMoney = (amount: number) => `PKR ${Number(amount).toLocaleString()}`;

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
  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const rows = [
    { label: "Base Fee", value: formatMoney(invoice.baseFee), highlight: false, neg: false },
    ...(invoice.discountAmt > 0 ? [{ label: `Discount (${invoice.discountType} – ${invoice.discountValue}%)`, value: `– ${formatMoney(invoice.discountAmt)}`, highlight: false, neg: true }] : []),
    { label: "Final Amount", value: formatMoney(invoice.finalAmt), highlight: true, neg: false },
    ...(invoice.paidAmt ? [{ label: "Amount Paid", value: formatMoney(invoice.paidAmt), highlight: false, neg: false }] : []),
    ...(invoice.paidAmt && invoice.paidAmt < invoice.finalAmt ? [{ label: "Balance Due", value: formatMoney(invoice.finalAmt - invoice.paidAmt), highlight: false, neg: true }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.section
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md z-10 overflow-hidden"
      >
        {/* Header strip */}
        <header className="bg-gradient-to-r from-primary/10 to-transparent px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-primary" aria-hidden="true" />
            <h3 id="invoice-detail-title" className="text-[13px] font-bold text-foreground m-0">Invoice {invoice.id}</h3>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" aria-hidden="true" /></Button>
        </header>

        <div className="px-6 py-5 space-y-5">
          {/* Status badge */}
          <div className="flex items-center justify-between" aria-label={`Invoice Status: ${statusConfig.label}`}>
            <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusConfig.className}`}>
              <StatusIcon className="w-3 h-3" aria-hidden="true" /> {statusConfig.label}
            </span>
            <span className="text-[11px] text-muted-foreground">Due: {invoice.dueDate}</span>
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
          <article className="rounded-xl border border-border overflow-hidden">
            <header className="px-4 py-2 bg-muted/30 border-b border-border">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide m-0">Fee Breakdown</h4>
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

        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
          <footer className="px-6 py-4 border-t border-border">
            <Button
              onClick={() => { onRecord(invoice); onClose(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <ReceiptText className="w-4 h-4" aria-hidden="true" /> Record Payment
            </Button>
          </footer>
        )}
      </motion.section>
    </div>
  );
}
