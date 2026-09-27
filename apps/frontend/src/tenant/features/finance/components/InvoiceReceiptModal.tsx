import React, { useRef } from "react";
import { Printer, X, ReceiptText, FileCode2, CloudUpload } from "lucide-react";
import type { Invoice } from "@/lib/data/financeData";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { ReceiptVoucher } from "./ReceiptVoucher";
import { useInvoiceReceiptActions } from "./useInvoiceReceiptActions";

export interface InvoiceReceiptModalProps {
  invoices: Invoice[];
  onClose: () => void;
  madrasaName?: string;
}

export const InvoiceReceiptModal = (function InvoiceReceiptModal({
  invoices,
  onClose,
  madrasaName = "Madrasa Management System",
}: InvoiceReceiptModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);
  const { handlePrint, handleExportTypst, handleExportZoho } = useInvoiceReceiptActions(
    invoices,
    madrasaName,
    printRef,
  );

  return (
    <div
      className="fixed inset-0 z-modal flex flex-col bg-background/95 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t("finance.receipt.title")}
    >
      {/* Toolbar */}
      <div className="sticky top-0 z-elevated flex items-center justify-between border-b border-border bg-background/90 backdrop-blur px-4 py-3 print:hidden">
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
          <Button size="sm" variant="outline" onClick={handleExportTypst} className="gap-1.5" title="Export Typst Compiler JSON">
            <FileCode2 className="w-3.5 h-3.5 text-info" aria-hidden />
            <span>Typst</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportZoho} className="gap-1.5" title="Export Zoho Invoice JSON">
            <CloudUpload className="w-3.5 h-3.5 text-warning" aria-hidden />
            <span>Zoho</span>
          </Button>
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

export default InvoiceReceiptModal;
