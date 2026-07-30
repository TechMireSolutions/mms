import React, { useState, useMemo } from "react";
import { Download, FileSpreadsheet, FileText, Printer, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import {
  exportExcel,
  exportPdf,
  type ExportColumn,
} from "@/components/ui/exportToolbarUtils";


export type { ExportColumn } from "@/components/ui/exportToolbarUtils";

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
    await exportExcel({
      title,
      columns: finalColumns,
      rows: finalRows,
      filename: resolvedFilename,
      moduleId,
      exportLabel,
      sourceColumns: columns,
      sourceHeaders: headers,
    });
  };

  const handlePdfExport = async (): Promise<void> => {
    await exportPdf({
      title,
      rows: finalRows,
      filename: resolvedFilename,
      orientation,
      formatSize,
      variant: resolvedVariant,
      sourceColumns: columns,
      sourceHeaders: headers,
    });
  };


  if (resolvedVariant === "compact") {
    return (
      <div className="flex items-center gap-1.5 flex-wrap" role="toolbar" aria-label={t("reports.export.tools")}>
        <div className="flex min-h-11 overflow-x-auto rounded-lg border border-border text-xs font-bold">
          <Button
            type="button"
            aria-pressed={compactFormat === "excel"}
            onClick={() => setCompactFormat("excel")}
            className={`flex min-h-11 items-center gap-1 h-auto px-2.5 py-2 rounded-none shadow-none font-bold transition-colors ${compactFormat === "excel" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <FileSpreadsheet className="w-3 h-3" aria-hidden="true" />
            {t("reports.export.excel")}
          </Button>
          <Button
            type="button"
            aria-pressed={compactFormat === "pdf"}
            onClick={() => setCompactFormat("pdf")}
            className={`flex min-h-11 items-center gap-1 h-auto px-2.5 py-2 rounded-none shadow-none border-s border-border font-bold transition-colors ${compactFormat === "pdf" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <FileText className="w-3 h-3" aria-hidden="true" />
            {t("reports.export.pdf")}
          </Button>
        </div>
        <Button
          type="button"
          aria-label={t("reports.export.exportAs", { format: compactFormat === "excel" ? t("reports.export.excel") : t("reports.export.pdf") })}
          onClick={compactFormat === "excel" ? handleExcelExport : handlePdfExport}
          className="flex min-h-11 items-center gap-1.5 h-auto px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" aria-hidden="true" />
          {t("reports.export.download")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-2 text-start relative">
      <p className="text-xs text-muted-foreground">
        {titlePrefix}
        <span className="font-semibold text-foreground">{title}</span>
        {titleSuffix}
      </p>
      
      <div className="flex items-center gap-2 flex-wrap">
        {showPdfSettings && (
          <div className="absolute end-0 bottom-full mb-2 bg-card border border-border rounded-xl p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[12.5rem] max-w-full">
             <div className="space-y-1.5">
               <label htmlFor="export-orientation" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.orientation")}</label>
               <div className="flex gap-1 p-1 bg-muted rounded-lg">
                 {[
                   { id: "p", label: t("reports.export.portrait") },
                   { id: "l", label: t("reports.export.landscape") },
                 ].map((opt) => (
                   <button
                     key={opt.id}
                     id={opt.id === "p" ? "export-orientation" : undefined}
                     onClick={() => setOrientation(opt.id as "p" | "l")}
                     className={`flex-1 min-h-11 px-2 py-2 rounded-md text-xs font-bold transition-all ${orientation === opt.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                   >
                     {opt.label}
                   </button>
                 ))}
               </div>
             </div>
              <div className="space-y-1.5">
                <label htmlFor="export-page-size" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("reports.export.pageSize")}</label>
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
          className="flex min-h-11 items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          type="button"
        >
          <Printer className="w-3.5 h-3.5" aria-hidden="true" />
          {t("reports.export.print")}
        </Button>
        <Button
          onClick={handleExcelExport}
          disabled={finalRows.length === 0}
          variant="outline"
          className="flex min-h-11 items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          type="button"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          {t("reports.export.excel")}
        </Button>

        <div className="flex min-h-11 overflow-x-auto rounded-lg border border-border bg-card">
          <Button
            onClick={handlePdfExport}
            disabled={finalRows.length === 0}
            variant="ghost"
            className="flex min-h-11 items-center gap-1.5 px-3 py-2 border-e border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 rounded-none"
            type="button"
          >
            <FileText className="w-3.5 h-3.5 text-destructive" aria-hidden="true" />
            {t("reports.export.pdf")}
          </Button>
          <Button
            onClick={() => setShowPdfSettings(!showPdfSettings)}
            variant="ghost"
            className={`min-h-11 min-w-11 px-2 py-2 hover:bg-muted transition-colors rounded-none ${showPdfSettings ? "text-primary bg-primary/5" : "text-muted-foreground"}`}
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
