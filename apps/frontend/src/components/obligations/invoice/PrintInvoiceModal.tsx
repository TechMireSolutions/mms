/**
 * PrintInvoiceModal
 * Shows a print-ready preview of the invoice for a specific collection.
 * Supports Print and Export PDF actions.
 */
import React, { useRef, useMemo } from "react";
import { X, Printer, FileDown, Settings } from "lucide-react";
import { loadTemplate, PAGE_SIZES, InvoiceTemplate } from "../../../lib/invoiceTemplateStore";
import { MOCK_CURRENCIES, ObligationCollection, ObligationType, MujtahidRep, Mujtahid } from '@/lib/data/obligationsData';
import { useMergedObligationContacts, useMergedObligationUsers } from "../../../hooks/useObligationLookups";
import InvoicePrintPreview from "./InvoicePrintPreview";

export interface PrintInvoiceModalProps {
  collection: ObligationCollection;
  obligationTypes?: ObligationType[];
  reps?: MujtahidRep[];
  mujtahids?: Mujtahid[];
  onClose: () => void;
  onOpenEditor?: () => void;
}

/**
 * PrintInvoiceModal component.
 * Shows a print-ready preview of the invoice for a specific collection.
 *
 * @param {PrintInvoiceModalProps} props
 * @returns {React.ReactElement}
 */
export default function PrintInvoiceModal({
  collection,
  obligationTypes = [],
  reps = [],
  mujtahids = [],
  onClose,
  onOpenEditor = undefined,
}: PrintInvoiceModalProps) {
  const template: InvoiceTemplate = loadTemplate();
  const size = PAGE_SIZES[template.pageSize] || PAGE_SIZES.A6;
  const printRef = useRef<HTMLDivElement>(null);

  const liveContacts = useMergedObligationContacts();
  const liveUsers = useMergedObligationUsers();

  const lookups = useMemo(() => ({
    contacts: liveContacts,
    users: liveUsers,
    currencies: MOCK_CURRENCIES,
    obligationTypes,
    mujtahids,
    reps,
  }), [liveContacts, liveUsers, obligationTypes, mujtahids, reps]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Receipt - ${collection.receipt_no}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: white; }
          @page { size: ${size.width}px ${size.height}px; margin: 0; }
          @media print { body { width: ${size.width}px; } }
        </style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap" />
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    // Use print dialog with PDF destination — works across browsers
    handlePrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="print-modal-title" 
        className="relative z-10 bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <div>
            <h2 id="print-modal-title" className="text-[15px] font-bold text-foreground m-0">Print Receipt</h2>
            <p className="text-xs text-muted-foreground m-0">Receipt No: <span className="font-mono font-bold text-primary">{collection.receipt_no}</span></p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenEditor && (
              <button type="button" onClick={onOpenEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors">
                <Settings className="w-3.5 h-3.5" aria-hidden="true" /> Customize Template
              </button>
            )}
            <button type="button" aria-label="Close modal" onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Preview */}
        <section aria-label="Invoice Preview" className="flex-1 overflow-auto bg-muted/40 flex items-start justify-center py-6 px-4">
          <div ref={printRef} style={{ lineHeight: 1.4 }}>
            <InvoicePrintPreview
              template={template}
              collection={collection}
              lookups={lookups}
              showBoundary
              scale={1}
            />
          </div>
        </section>

        {/* Footer actions */}
        <footer className="flex items-center justify-between px-5 py-3.5 border-t border-border flex-shrink-0 bg-muted/20">
          <p className="text-[10px] text-muted-foreground m-0">
            Page size: <span className="font-semibold">{template.pageSize}</span> · {size.width}×{size.height}px
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">
              <FileDown className="w-4 h-4" aria-hidden="true" /> Export PDF
            </button>
            <button type="button" onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
              <Printer className="w-4 h-4" aria-hidden="true" /> Print
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
