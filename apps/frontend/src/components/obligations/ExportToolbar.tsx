import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { Button } from "@/components/ui/button";

export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportToolbarProps {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  filename: string;
  /** When set, Excel export registers in the global background jobs tray. */
  moduleId?: string;
  exportLabel?: string;
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

function downloadExcel(columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const csv = toCSV(columns, rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPDF(columns: ExportColumn[], rows: Record<string, unknown>[], filename: string, title: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}  |  ${rows.length} record${rows.length !== 1 ? "s" : ""}`, 14, 20);
  doc.setTextColor(0);

  // Column widths: distribute equally, max page width ~267mm (A4 landscape - margins)
  const pageW = 267;
  const colW = Math.min(Math.floor(pageW / columns.length), 55);
  const startX = 14;
  let y = 28;

  // Header row
  doc.setFillColor(5, 150, 105); // emerald
  doc.rect(startX, y, colW * columns.length, 7, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255);
  columns.forEach((col, i) => {
    doc.text(col.header.toUpperCase(), startX + i * colW + 2, y + 5, { maxWidth: colW - 3 });
  });
  doc.setTextColor(0);
  y += 8;

  // Data rows
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  rows.forEach((row, ri) => {
    if (y > 190) { doc.addPage(); y = 14; }
    if (ri % 2 === 0) {
      doc.setFillColor(245, 250, 247);
      doc.rect(startX, y, colW * columns.length, 6.5, "F");
    }
    columns.forEach((col, i) => {
      const cellValue = String(row[col.key] ?? "");
      doc.text(cellValue, startX + i * colW + 2, y + 4.5, { maxWidth: colW - 3 });
    });
    y += 6.5;
  });

  // Footer line
  doc.setDrawColor(200);
  doc.line(startX, y + 1, startX + colW * columns.length, y + 1);

  doc.save(`${filename}.pdf`);
}

/**
 * ExportToolbar component.
 * 
 * Provides Excel and PDF export functionality for a data grid.
 * 
 * @param {ExportToolbarProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function ExportToolbar({
  title,
  columns,
  rows,
  filename,
  moduleId,
  exportLabel,
}: ExportToolbarProps) {
  const [format, setFormat] = useState<"excel" | "pdf">("excel");

  const handleExport = () => {
    if (format === "excel") {
      if (moduleId) {
        runGridCsvExportJob({
          moduleId,
          label: exportLabel ?? title,
          filename,
          columns,
          rows,
        });
        return;
      }
      downloadExcel(columns, rows, filename);
    } else {
      void downloadPDF(columns, rows, filename, title);
    }
  };

  return (
    <div className="flex items-center gap-1.5" role="toolbar" aria-label="Export tools">
      {/* Format picker */}
      <div className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold">
        <Button
          type="button"
          aria-pressed={format === "excel"}
          onClick={() => setFormat("excel")}
          className={`flex items-center gap-1 h-auto px-2.5 py-1.5 rounded-none shadow-none font-bold transition-colors ${format === "excel" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
        >
          <FileSpreadsheet className="w-3 h-3" aria-hidden="true" /> Excel
        </Button>
        <Button
          type="button"
          aria-pressed={format === "pdf"}
          onClick={() => setFormat("pdf")}
          className={`flex items-center gap-1 h-auto px-2.5 py-1.5 rounded-none shadow-none border-l border-border font-bold transition-colors ${format === "pdf" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-card text-muted-foreground hover:bg-muted"}`}
        >
          <FileText className="w-3 h-3" aria-hidden="true" /> PDF
        </Button>
      </div>
      {/* Export button */}
      <Button
        type="button"
        aria-label={`Export as ${format === "excel" ? "Excel" : "PDF"}`}
        onClick={handleExport}
        className="flex items-center gap-1.5 h-auto px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors"
      >
        <Download className="w-3 h-3" aria-hidden="true" /> Export
      </Button>
    </div>
  );
}
