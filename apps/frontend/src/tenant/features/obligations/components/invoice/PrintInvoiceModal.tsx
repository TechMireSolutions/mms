import React, { useRef, useState } from "react";
import { Printer, FileDown, Loader2, Settings } from "lucide-react";
import { getPageDimensions, loadTemplate, type InvoiceTemplate } from "@/lib/invoiceTemplateStore";
import { type ObligationCollection, type ObligationType, type MujtahidRep, type Mujtahid } from '@/lib/data/obligationsData';
import { DEFAULT_CURRENCIES } from '@mms/shared';
import { useMergedObligationContacts, useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { InvoicePrintPreview } from "@/tenant/features/obligations/components/invoice/InvoicePrintPreview";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const template: InvoiceTemplate = loadTemplate();
  const size = getPageDimensions(template.pageSize, template.orientation);
  const printRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const contactIds = (() => [collection.sender_id, collection.reference_id])();
  const liveContacts = useMergedObligationContacts(contactIds);
  const liveUsers = useMergedObligationUsers([collection.received_by]);
  const currencies = DEFAULT_CURRENCIES;

  const lookups = (() => ({
    contacts: liveContacts,
    users: liveUsers,
    currencies,
    obligationTypes,
    mujtahids,
    reps,
  }))();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>${t("obligations.print.windowTitle", { number: collection.receipt_no })}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: white; }
          @page { size: ${size.width}px ${size.height}px ${template.orientation || "portrait"}; margin: 0; }
          @media print {
            body {
              width: ${size.width}px;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Amiri:wght@400;700&display=swap" />
      </head>
      <body>
        ${content.innerHTML}
        <script>
          window.addEventListener('load', function() {
            window.focus();
            window.print();
          });
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // Window already handled or closed
      }
    }, 300);
  };

  const handleExportPDF = async () => {
    const target = exportRef.current || printRef.current;
    if (!target || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      // Pre-load web fonts so text glyphs render with exact metrics
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Ensure any images (branding logo, QR code) are fully loaded
      const images = Array.from(target.querySelectorAll("img"));
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              }
            })
        )
      );

      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;

      const canvas = await html2canvas(target, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: size.width,
        height: size.height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: size.width,
        windowHeight: size.height,
      });

      const imgData = canvas.toDataURL("image/png");
      const orientation = size.width > size.height ? "landscape" : "portrait";
      const pdfWidth = size.width * 0.264583;
      const pdfHeight = size.height * 0.264583;

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`Receipt-${collection.receipt_no || "obligation"}.pdf`);
    } catch {
      // Fallback to print dialog if canvas capture fails
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("obligations.print.title")}
      subtitle={t("obligations.print.receiptNo", { number: collection.receipt_no })}
      icon={Printer}
      size="lg"
      headerActions={
        onOpenEditor ? (
          <Button
            type="button"
            onClick={onOpenEditor}
            variant="outline"
            className="flex min-h-11 items-center gap-1.5 px-3 py-1.5 h-auto text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" /> {t("obligations.print.customizeTemplate")}
          </Button>
        ) : null
      }
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0 min-w-0 text-xs text-muted-foreground">
            {t("obligations.print.pageSize", {
              size: template.pageSize,
              width: size.width,
              height: size.height,
            })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="min-h-11 px-4 py-2 h-auto rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors shadow-none"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleExportPDF}
              disabled={isGeneratingPdf}
              variant="outline"
              className="flex min-h-11 items-center gap-2 px-4 py-2 h-auto rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors shadow-none disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t("obligations.invoiceTemplate.exportingPdf")}
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" aria-hidden="true" /> {t("reports.export.pdf")}
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="flex min-h-11 items-center gap-2 px-5 py-2 h-auto rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <Printer className="w-4 h-4" aria-hidden="true" /> {t("reports.export.print")}
            </Button>
          </div>
        </div>
      }
    >
      {/* Offscreen unscaled container for clean, high-fidelity PDF rasterization */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: size.width,
          height: size.height,
          zIndex: -9999,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          ref={exportRef}
          style={{
            width: size.width,
            height: size.height,
            backgroundColor: "#ffffff",
            position: "relative",
            lineHeight: 1.25,
            direction: "ltr",
          }}
        >
          <InvoicePrintPreview
            template={template}
            collection={collection}
            lookups={lookups}
            showBoundary={false}
            scale={1}
          />
        </div>
      </div>

      <div className="flex min-h-preview-tall justify-center overflow-x-auto rounded-xl border border-dashed border-border bg-muted/20 p-4">
        <div className="origin-top scale-preview-sm sm:scale-preview-md md:scale-preview-lg lg:scale-preview-xl" style={{ direction: "ltr" }}>
          <div
            ref={printRef}
            style={{ lineHeight: 1.4, width: size.width, height: size.height }}
          >
            <InvoicePrintPreview
              template={template}
              collection={collection}
              lookups={lookups}
              showBoundary
              scale={1}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
