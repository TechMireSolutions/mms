import React, { useState, useMemo } from "react";
import { Download, FileSpreadsheet, FileText, Printer, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { formatDate, todayISO, buildCsvContent } from "@mms/shared";
import { triggerFileDownload } from "@/lib/download";


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

function downloadExcelFallback(columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const { headers, data } = extractExportTable(columns, rows);
  const csv = buildCsvContent([headers, ...data]);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, `${filename}.csv`);
}

function extractExportTable(
  columns?: ExportColumn[],
  rows: Record<string, unknown>[] = [],
  headers?: string[]
) {
  if (columns && columns.length > 0) {
    const tableHeaders = columns.map((col) => col.header);
    const tableData = rows.map((row) =>
      columns.map((col) => (row[col.key] != null ? (row[col.key] as string | number | boolean) : ""))
    );
    const mappedObjects = rows.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col) => {
        obj[col.header] = row[col.key] ?? "";
      });
      return obj;
    });
    return { headers: tableHeaders, data: tableData, mappedObjects };
  }

  const tableHeaders = headers || (rows.length > 0 ? Object.keys(rows[0]) : []);
  const tableData = rows.map((row) => Object.values(row) as (string | number | boolean)[]);
  return { headers: tableHeaders, data: tableData, mappedObjects: rows };
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
  const resolvedFilename = useMemo(() => filename || title.toLowerCase().replace(/\s+/g, "_"), [filename, title]);

  const [titlePrefix, titleSuffix] = useMemo(() => {
    const parts = t("reports.export.title", { name: "||TITLE||" }).split("||TITLE||");
    return [parts[0] || "", parts[1] || ""];
  }, [t]);

  const pageSizeOptions = useMemo(
    () => [
      { value: "a4", label: t("reports.builder.formatA4") },
      { value: "letter", label: t("reports.builder.formatLetter") },
      { value: "a3", label: t("reports.builder.formatA3") },
      { value: "legal", label: t("reports.builder.formatLegal") },
    ],
    [t]
  );

  // Determine underlying data and columns
  const finalRows = useMemo(() => rows || (data as Record<string, unknown>[]) || [], [rows, data]);
  const finalColumns = useMemo(
    () => columns || (headers ? headers.map((h) => ({ header: h, key: h })) : []),
    [columns, headers]
  );

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
      const { mappedObjects } = extractExportTable(columns, finalRows, headers);
      const worksheet = XLSX.utils.json_to_sheet(mappedObjects);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${resolvedFilename}_${todayISO()}.xlsx`);
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

    const { headers: tableHeaders, data: tableData } = extractExportTable(columns, finalRows, headers);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData as (string | number | boolean)[][],
      startY: 26,
      styles: { fontSize: resolvedOrientation === "l" || resolvedOrientation === "landscape" ? 8 : 10 },
    });

    doc.save(`${resolvedFilename}_${todayISO()}.pdf`);
  };


  if (resolvedVariant === "compact") {
    return (
      <div className="flex items-center gap-1.5" role="toolbar" aria-label={t("reports.export.tools")}>
        <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold">
          <Button
            type="button"
            aria-pressed={compactFormat === "excel"}
            onClick={() => setCompactFormat("excel")}
            className={`flex items-center gap-1 h-auto px-2.5 py-1.5 rounded-none shadow-none font-bold transition-colors ${compactFormat === "excel" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <FileSpreadsheet className="w-3 h-3" aria-hidden="true" />
            {t("reports.export.excel")}
          </Button>
          <Button
            type="button"
            aria-pressed={compactFormat === "pdf"}
            onClick={() => setCompactFormat("pdf")}
            className={`flex items-center gap-1 h-auto px-2.5 py-1.5 rounded-none shadow-none border-l border-border font-bold transition-colors ${compactFormat === "pdf" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <FileText className="w-3 h-3" aria-hidden="true" />
            {t("reports.export.pdf")}
          </Button>
        </div>
        <Button
          type="button"
          aria-label={t("reports.export.exportAs", { format: compactFormat === "excel" ? t("reports.export.excel") : t("reports.export.pdf") })}
          onClick={compactFormat === "excel" ? handleExcelExport : handlePdfExport}
          className="flex items-center gap-1.5 h-auto px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" aria-hidden="true" />
          {t("reports.export.download")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-2 text-left relative">
      <p className="text-xs text-muted-foreground">
        {titlePrefix}
        <span className="font-semibold text-foreground">{title}</span>
        {titleSuffix}
      </p>
      
      <div className="flex items-center gap-2">
        {showPdfSettings && (
          <div className="absolute end-0 bottom-full mb-2 bg-card border border-border rounded-xl p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[200px]">
             <div className="space-y-1.5">
               <label htmlFor="export-orientation" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.orientation")}</label>
               <div className="flex gap-1 p-1 bg-muted rounded-lg">
                 {[
                   { id: "p", label: t("reports.export.portrait") },
                   { id: "l", label: t("reports.export.landscape") },
                 ].map((opt) => (
                   <button
                     key={opt.id}
                     id={opt.id === "p" ? "export-orientation" : undefined}
                     onClick={() => setOrientation(opt.id as "p" | "l")}
                     className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${orientation === opt.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                   >
                     {opt.label}
                   </button>
                 ))}
               </div>
             </div>
              <div className="space-y-1.5">
                <label htmlFor="export-page-size" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.pageSize")}</label>
                <FormSelect
                  id="export-page-size"
                  value={formatSize}
                  onChange={setFormatSize}
                  options={pageSizeOptions}
                />
              </div>
          </div>
        )}

        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors h-auto"
          type="button"
        >
          <Printer className="w-3.5 h-3.5" aria-hidden="true" />
          {t("reports.export.print")}
        </Button>
        <Button
          onClick={handleExcelExport}
          disabled={finalRows.length === 0}
          variant="outline"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 h-auto"
          type="button"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          {t("reports.export.excel")}
        </Button>

        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          <Button
            onClick={handlePdfExport}
            disabled={finalRows.length === 0}
            variant="ghost"
            className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 h-auto rounded-none"
            type="button"
          >
            <FileText className="w-3.5 h-3.5 text-destructive" aria-hidden="true" />
            {t("reports.export.pdf")}
          </Button>
          <Button
            onClick={() => setShowPdfSettings(!showPdfSettings)}
            variant="ghost"
            className={`px-2 py-1.5 hover:bg-muted transition-colors h-auto rounded-none ${showPdfSettings ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
            title={t("reports.export.settings")}
            type="button"
          >
            <SettingsIcon className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
