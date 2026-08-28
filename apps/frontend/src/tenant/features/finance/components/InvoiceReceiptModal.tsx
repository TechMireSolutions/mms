import React, { useRef } from "react";
import { Printer, X, ReceiptText } from "lucide-react";
import type { Invoice } from "@/lib/data/financeData";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { formatDate, getCollectedAmountForInvoice, getOutstandingAmountForInvoice } from "@mms/shared";
import { cn } from "@/lib/utils";

export interface InvoiceReceiptModalProps {
  invoices: Invoice[];
  onClose: () => void;
  madrasaName?: string;
}

function ReceiptVoucher({ invoice, madrasaName }: {
  invoice: Invoice;
  madrasaName: string;
}) {
  const { t } = useTranslation();
  const { formatCurrency } = useFinanceCurrency();
  const collected = getCollectedAmountForInvoice(invoice);
  const outstanding = getOutstandingAmountForInvoice(invoice);

  return (
    <div className="receipt-voucher print:break-after-page border border-border rounded-xl p-6 space-y-5 bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{madrasaName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("finance.receipt.officialReceipt")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
          <ReceiptText className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold text-primary">{t("finance.receipt.title")}</span>
        </div>
      </div>

      {/* Voucher meta */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <div>
          <span className="text-muted-foreground">{t("finance.receipt.voucherNo")}: </span>
          <span className="font-semibold text-foreground">{invoice.id}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("finance.receipt.dateIssued")}: </span>
          <span className="font-semibold text-foreground">{formatDate(invoice.paidDate ?? invoice.dueDate)}</span>
        </div>
      </div>

      {/* Student info */}
      <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
        <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">{t("finance.receipt.studentInfo")}</p>
        <p className="font-bold text-foreground">{invoice.studentName}</p>
        <p className="text-muted-foreground">{invoice.class} · {invoice.session}</p>
      </div>

      {/* Fee summary */}
      <div className="space-y-2">
        <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">{t("finance.receipt.feeSummary")}</p>
        <div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden">
          <ReceiptRow label={t("finance.columns.baseFee")} value={formatCurrency(invoice.baseFee)} />
          {invoice.discountAmt > 0 && (
            <ReceiptRow label={t("finance.detail.discount", { type: invoice.discountType ?? "", value: invoice.discountValue ?? 0 })} value={`- ${formatCurrency(invoice.discountAmt)}`} neg />
          )}
          <ReceiptRow label={t("finance.form.finalAmount")} value={formatCurrency(invoice.finalAmt)} highlight />
          {collected > 0 && <ReceiptRow label={t("finance.detail.amountPaid")} value={formatCurrency(collected)} />}
          {outstanding > 0 && <ReceiptRow label={t("finance.balanceDue")} value={formatCurrency(outstanding)} neg />}
        </div>
      </div>

      {/* Payment details */}
      {(invoice.paidDate ?? invoice.method) && (
        <div className="space-y-2">
          <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">{t("finance.receipt.paymentDetails")}</p>
          <div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden">
            {invoice.paidDate && <ReceiptRow label={t("finance.detail.due", { date: "" }).replace(": ", "")} value={formatDate(invoice.paidDate)} />}
            {invoice.method && <ReceiptRow label={t("finance.columns.method")} value={invoice.method} />}
          </div>
        </div>
      )}

      {/* Signature strip */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
        <SignatureBlock label={t("finance.receipt.authorizedSignature")} />
        <SignatureBlock label={t("finance.receipt.parentSignature")} />
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, highlight, neg }: { label: string; value: string; highlight?: boolean; neg?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-2 text-sm", highlight && "bg-primary/5")}>
      <span className={cn("text-muted-foreground", highlight && "font-semibold text-foreground")}>{label}</span>
      <span className={cn("font-semibold", highlight ? "text-primary" : neg ? "text-destructive" : "text-foreground")}>{value}</span>
    </div>
  );
}

function SignatureBlock({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <div className="h-12 border-b border-dashed border-border" aria-hidden />
      <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
  );
}

export const InvoiceReceiptModal = React.memo(function InvoiceReceiptModal({
  invoices,
  onClose,
  madrasaName = "Madrasa Management System",
}: InvoiceReceiptModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t("finance.receipt.title")}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; background: #fff; padding: 20px; }
            .receipt-voucher { border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px; page-break-after: always; }
            .receipt-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
            .receipt-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 13px; margin-bottom: 12px; }
            .receipt-section { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
            .receipt-row { display: flex; justify-content: space-between; padding: 8px 16px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
            .receipt-row:last-child { border-bottom: none; }
            .highlight { background: #f0f9ff; font-weight: 700; }
            .sig-block { border-bottom: 1px dashed #9ca3af; height: 40px; margin-bottom: 6px; }
            .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px; }
            .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
            .muted { color: #6b7280; }
            .bold { font-weight: 700; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t("finance.receipt.title")}
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 backdrop-blur px-4 py-3 print:hidden">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-foreground">
            {invoices.length > 1
              ? t("finance.printReceipts")
              : t("finance.printReceipt")}
          </span>
          <span className="text-xs text-muted-foreground">({invoices.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-3.5 h-3.5" aria-hidden />
            {t("finance.printReceipt")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label={t("common.close")}>
            <X className="w-4 h-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Receipt content */}
      <div ref={printRef} className="mx-auto w-full max-w-2xl p-6 space-y-6">
        {invoices.map((invoice) => (
          <ReceiptVoucher
            key={invoice.id}
            invoice={invoice}
            madrasaName={madrasaName ?? "Madrasa"}
          />
        ))}
      </div>
    </div>
  );
});
