import { formatDate, todayISO, buildCsvContent } from "@mms/shared";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { triggerFileDownload } from "@/lib/download";

export interface ExportColumn {
  header: string;
  key: string;
}

type ExportCell = string | number | boolean;

export interface ExportTable {
  headers: string[];
  data: ExportCell[][];
  mappedObjects: Record<string, unknown>[];
}

interface ExcelExportOptions {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  filename: string;
  moduleId?: string;
  exportLabel?: string;
  sourceColumns?: ExportColumn[];
  sourceHeaders?: string[];
}

interface PdfExportOptions {
  title: string;
  rows: Record<string, unknown>[];
  filename: string;
  orientation: "p" | "l";
  formatSize: string;
  variant: "default" | "compact";
  sourceColumns?: ExportColumn[];
  sourceHeaders?: string[];
}

export function extractExportTable(
  columns?: ExportColumn[],
  rows: Record<string, unknown>[] = [],
  headers?: string[],
): ExportTable {
  if (columns && columns.length > 0) {
    const tableHeaders = columns.map((col) => col.header);
    const tableData = rows.map((row) =>
      columns.map((col) => (row[col.key] != null ? (row[col.key] as ExportCell) : "")),
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
  const tableData = rows.map((row) => Object.values(row) as ExportCell[]);
  return { headers: tableHeaders, data: tableData, mappedObjects: rows };
}

export function downloadExcelFallback(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  filename: string,
): void {
  const { headers, data } = extractExportTable(columns, rows);
  const csv = buildCsvContent([headers, ...data]);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, `${filename}.csv`);
}

export async function exportExcel({
  title,
  columns,
  rows,
  filename,
  moduleId,
  exportLabel,
  sourceColumns,
  sourceHeaders,
}: ExcelExportOptions): Promise<void> {
  if (rows.length === 0) return;

  if (moduleId) {
    runGridCsvExportJob({
      moduleId,
      label: exportLabel || title,
      filename,
      columns,
      rows,
    });
    return;
  }

  try {
    const XLSX = await import("xlsx");
    const { mappedObjects } = extractExportTable(sourceColumns, rows, sourceHeaders);
    const worksheet = XLSX.utils.json_to_sheet(mappedObjects);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}_${todayISO()}.xlsx`);
  } catch {
    downloadExcelFallback(columns, rows, filename);
  }
}

export async function exportPdf({
  title,
  rows,
  filename,
  orientation,
  formatSize,
  variant,
  sourceColumns,
  sourceHeaders,
}: PdfExportOptions): Promise<void> {
  if (rows.length === 0) return;

  const [jsPDFModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const jsPDF = jsPDFModule.default;
  const autoTable = autoTableModule.default;
  const resolvedOrientation = variant === "compact" ? "landscape" : orientation;

  const doc = new jsPDF({
    orientation: resolvedOrientation as "p" | "l" | "portrait" | "landscape",
    unit: "mm",
    format: formatSize,
  });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 14);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(
    `Generated: ${formatDate(new Date())}  |  ${rows.length} record${rows.length !== 1 ? "s" : ""}`,
    14,
    20,
  );
  doc.setTextColor(0);

  const { headers: tableHeaders, data: tableData } = extractExportTable(sourceColumns, rows, sourceHeaders);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: 26,
    styles: { fontSize: resolvedOrientation === "l" || resolvedOrientation === "landscape" ? 8 : 10 },
  });

  doc.save(`${filename}_${todayISO()}.pdf`);
}
