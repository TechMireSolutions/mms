import React, { useRef, useMemo } from "react";
import { Printer, FileDown, Settings } from "lucide-react";
import { loadTemplate, PAGE_SIZES, InvoiceTemplate } from "@/lib/invoiceTemplateStore";
import { ObligationCollection, ObligationType, MujtahidRep, Mujtahid } from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES } from '@mms/shared';
import { useMergedObligationContacts, useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { InvoicePrintPreview } from "@/tenant/features/obligations/components/invoice/InvoicePrintPreview";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

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
export function PrintInvoiceModal({
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

  const contactIds = useMemo(
    () => [collection.sender_id, collection.reference_id],
    [collection.sender_id, collection.reference_id],
  );
  const liveContacts = useMergedObligationContacts(contactIds);
  const liveUsers = useMergedObligationUsers();
  const currencies = DEFAULT_CURRENCIES;

  const lookups = useMemo(() => ({
    contacts: liveContacts,
    users: liveUsers,
    currencies,
    obligationTypes,
    mujtahids,
    reps,
  }), [liveContacts, liveUsers, currencies, obligationTypes, mujtahids, reps]);

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
    <Modal
      open
      onClose={onClose}
      title="Print Receipt"
      subtitle={`Receipt No: ${collection.receipt_no}`}
      icon={Printer}
      size="lg"
      headerActions={
        onOpenEditor ? (
          <Button
            type="button"
            onClick={onOpenEditor}
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" /> Customize Template
          </Button>
        ) : null
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <p className="text-[10px] text-muted-foreground m-0">
            Page size: <span className="font-semibold">{template.pageSize}</span> · {size.width}×{size.height}px
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-4 py-2 h-auto rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors shadow-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExportPDF}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 h-auto rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors shadow-none"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" /> Export PDF
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 h-auto rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Printer className="w-4 h-4" aria-hidden="true" /> Print
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex justify-center bg-muted/20 border border-dashed border-border rounded-xl p-4 overflow-x-auto min-h-[300px]">
        <div ref={printRef} style={{ lineHeight: 1.4 }}>
          <InvoicePrintPreview
            template={template}
            collection={collection}
            lookups={lookups}
            showBoundary
            scale={1}
          />
        </div>
      </div>
    </Modal>
  );
}
