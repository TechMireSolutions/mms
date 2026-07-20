import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { Button } from "@/components/ui/button";
import { formatDate } from "@mms/shared";

export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportToolbarProps {
  title: string;
  // Options for ObligationsSummary style
  columns?: ExportColumn[];
  rows?: Record<string, unknown>[];
  filename?: string;
  moduleId?: string;
  exportLabel?: string;
  // Options for ReportExportBar style
  onPrint?: () => void;
  data?: unknown[];
  headers?: string[];
  // Layout variant
  variant?: "default" | "compact";
}

function toCSV(columns: ExportColumn[], rows: Record<string, unknown>[]): string {
  const header = columns.map((column) => `"${column.header}"`).join(",");
  const body = rows.map((row) =>
    columns.map((column) => {
      const cellValue = row[column.key] ?? "";
      return `"${String(cellValue).replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [header, ...body].join("\r\n");
}

function downloadExcelFallback(columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const csv = toCSV(columns, rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportToolbar({
  title,
  columns,
  rows,
  filename,
  moduleId,
  exportLabel,
  onPrint,
  data,
  headers,
  variant,
}: ExportToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [orientation, setOrientation] = useState<"p" | "l">("p");
  const [formatSize, setFormatSize] = useState<string>("a4");
  const [showPdfSettings, setShowPdfSettings] = useState<boolean>(false);
  const [compactFormat, setCompactFormat] = useState<"excel" | "pdf">("excel");

  const resolvedVariant = variant || (data ? "default" : "compact");
  const resolvedFilename = filename || title.toLowerCase().replace(/\s+/g, "_");

  // Determine underlying data and columns
  const finalRows = rows || (data as Record<string, unknown>[]) || [];
  const finalColumns = columns || (headers ? headers.map(h => ({ header: h, key: h })) : []);

  const handlePrint = (): void => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const handleExcelExport = async (): Promise<void> => {
    if (finalRows.length === 0) return;

    if (moduleId) {
      runGridCsvExportJob({
        moduleId,
        label: exportLabel || title,
        filename: resolvedFilename,
        columns: finalColumns,
        rows: finalRows,
      });
      return;
    }

    try {
      const XLSX = await import("xlsx");
      let worksheet;

      if (columns && columns.length > 0) {
        // Map rows to column headers
        const mapped = finalRows.map(row => {
          const obj: Record<string, unknown> = {};
          columns.forEach(col => {
            obj[col.header] = row[col.key] ?? "";
          });
          return obj;
        });
        worksheet = XLSX.utils.json_to_sheet(mapped);
      } else {
        worksheet = XLSX.utils.json_to_sheet(finalRows);
      }

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${resolvedFilename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      // Fallback to local CSV download if xlsx chunk fails to load
      downloadExcelFallback(finalColumns, finalRows, resolvedFilename);
    }
  };

  const handlePdfExport = async (): Promise<void> => {
    if (finalRows.length === 0) return;

    const [jsPDFModule, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const jsPDF = jsPDFModule.default;
    const autoTable = autoTableModule.default;

    // Use landscape default for compact variant ( ObligationsSummary default )
    const resolvedOrientation = resolvedVariant === "compact" ? "landscape" : orientation;

    const doc = new jsPDF({
      orientation: resolvedOrientation as "p" | "l" | "portrait" | "landscape",
      unit: "mm",
      format: formatSize,
    });

    // Draw Title & Metadata
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 14);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Generated: ${formatDate(new Date())}  |  ${finalRows.length} record${finalRows.length !== 1 ? "s" : ""}`, 14, 20);
    doc.setTextColor(0);

    // Extract table headers and cells
    let tableHeaders: string[] = [];
    let tableData: (string | number | boolean)[][] = [];

    if (columns && columns.length > 0) {
      tableHeaders = columns.map(col => col.header);
      tableData = finalRows.map(row =>
        columns.map(col => String(row[col.key] ?? ""))
      );
    } else {
      tableHeaders = headers || (finalRows.length > 0 ? Object.keys(finalRows[0]) : []);
      tableData = finalRows.map(row => Object.values(row) as (string | number | boolean)[]);
    }

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData as (string | number | boolean)[][],
      startY: 26,
      styles: { fontSize: resolvedOrientation === "l" || resolvedOrientation === "landscape" ? 8 : 10 },
    });

    doc.save(`${resolvedFilename}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (resolvedVariant === "compact") {
    return (
      <div className="flex items-center gap-1.5" role="toolbar" aria-label="Export tools">
        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold">
          <Button
            type="button"
            aria-pressed={compactFormat === "excel"}
            onClick={() => setCompactFormat("excel")}
            className={`flex items-center gap-1 h-auto px-2.5 py-1.5 rounded-none shadow-none font-bold transition-colors ${compactFormat === "excel" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <FileSpreadsheet className="w-3 h-3" aria-hidden="true" /> Excel
          </Button>
          <Button
            type="button"
            aria-pressed={compactFormat === "pdf"}
            onClick={() => setCompactFormat("pdf")}
            className={`flex items-center gap-1 h-auto px-2.5 py-1.5 rounded-none shadow-none border-l border-border font-bold transition-colors ${compactFormat === "pdf" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <FileText className="w-3 h-3" aria-hidden="true" /> PDF
          </Button>
        </div>
        <Button
          type="button"
          aria-label={`Export as ${compactFormat === "excel" ? "Excel" : "PDF"}`}
          onClick={compactFormat === "excel" ? handleExcelExport : handlePdfExport}
          className="flex items-center gap-1.5 h-auto px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" aria-hidden="true" /> Export
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-2 text-left relative">
      <p className="text-xs text-muted-foreground">
        {t("reports.export.title", { name: "{name}" }).split("{name}")[0]}
        <span className="font-semibold text-foreground">{title}</span>
        {t("reports.export.title", { name: "{name}" }).split("{name}")[1]}
      </p>
      
      <div className="flex items-center gap-2">
        {showPdfSettings && (
          <div className="absolute end-0 bottom-full mb-2 bg-card border border-border rounded-xl p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[200px]">
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.orientation")}</label>
               <div className="flex gap-1 p-1 bg-muted rounded-lg">
                 <button 
                  onClick={() => setOrientation("p")}
                  className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${orientation === "p" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                 >
                   {t("reports.export.portrait")}
                 </button>
                 <button 
                  onClick={() => setOrientation("l")}
                  className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${orientation === "l" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                 >
                   {t("reports.export.landscape")}
                 </button>
               </div>
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.pageSize")}</label>
               <select 
                value={formatSize}
                onChange={(event) => setFormatSize(event.target.value)}
                className="w-full text-xs rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
               >
                 <option value="a4">{t("reports.builder.formatA4")}</option>
                 <option value="letter">{t("reports.builder.formatLetter")}</option>
                 <option value="a3">{t("reports.builder.formatA3")}</option>
                 <option value="legal">{t("reports.builder.formatLegal")}</option>
               </select>
             </div>
          </div>
        )}

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
        >
          <Printer className="w-3.5 h-3.5" />
          {t("reports.export.print")}
        </button>
        <button 
          onClick={handleExcelExport}
          disabled={finalRows.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50" 
          type="button"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-success" />
          {t("reports.export.excel")}
        </button>
        
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          <button 
            onClick={handlePdfExport}
            disabled={finalRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50" 
            type="button"
          >
            <FileText className="w-3.5 h-3.5 text-destructive" />
            {t("reports.export.pdf")}
          </button>
          <button 
            onClick={() => setShowPdfSettings(!showPdfSettings)}
            className={`px-2 py-1.5 hover:bg-muted transition-colors ${showPdfSettings ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
            title={t("reports.export.settings")}
            type="button"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
