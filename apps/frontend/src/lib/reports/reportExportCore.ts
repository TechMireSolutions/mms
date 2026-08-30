import { formatDate, todayISO, buildCsvContent } from "@mms/shared";
import { runGridCsvExportJob } from "@/lib/backgroundJobs/runGridCsvExportJob";
import { triggerFileDownload } from "@/lib/download";

export interface ExportColumn {
  header: string;
  key: string;
}

export type ExportCell = string | number | boolean;

export interface ExportTable {
  headers: string[];
  data: ExportCell[][];
  mappedObjects: Record<string, unknown>[];
}

export interface ExcelExportOptions {
  title: string;
  columns?: ExportColumn[];
  rows: Record<string, unknown>[];
  filename: string;
  moduleId?: string;
  exportLabel?: string;
  sourceColumns?: ExportColumn[];
  sourceHeaders?: string[];
}

export interface PdfExportOptions {
  title: string;
  columns?: ExportColumn[];
  rows: Record<string, unknown>[];
  filename: string;
  orientation?: "p" | "l" | "portrait" | "landscape";
  formatSize?: string;
  variant?: "default" | "compact";
  sourceColumns?: ExportColumn[];
  sourceHeaders?: string[];
}

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Escapes potentially unsafe formula-injection characters for CSV/Excel cells.
 */
export function sanitizeExportValue(value: unknown): ExportCell {
  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;

  const str = String(value);
  if (FORMULA_PREFIXES.some((prefix) => str.startsWith(prefix))) {
    return `'${str}`;
  }
  return str;
}

/**
 * Normalizes tabular row/column records into headers, rows, and mapped objects.
 */
export function extractExportTable(
  columns?: ExportColumn[],
  rows: Record<string, unknown>[] = [],
  headers?: string[],
): ExportTable {
  if (columns && columns.length > 0) {
    const tableHeaders = columns.map((col) => col.header);
    const tableData = rows.map((row) =>
      columns.map((col) => sanitizeExportValue(row[col.key])),
    );
    const mappedObjects = rows.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col) => {
        obj[col.header] = sanitizeExportValue(row[col.key]);
      });
      return obj;
    });
    return { headers: tableHeaders, data: tableData, mappedObjects };
  }

  const tableHeaders = headers || (rows.length > 0 ? Object.keys(rows[0]) : []);
  const tableData = rows.map((row) =>
    tableHeaders.map((header) => sanitizeExportValue(row[header])),
  );
  const mappedObjects = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    tableHeaders.forEach((header) => {
      obj[header] = sanitizeExportValue(row[header]);
    });
    return obj;
  });

  return { headers: tableHeaders, data: tableData, mappedObjects };
}

/**
 * Fallback to direct CSV file download if xlsx library is unavailable.
 */
export function downloadExcelFallback(
  columns: ExportColumn[] | undefined,
  rows: Record<string, unknown>[],
  filename: string,
  headers?: string[],
): void {
  const { headers: tableHeaders, data } = extractExportTable(columns, rows, headers);
  const csv = buildCsvContent([tableHeaders, ...data]);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, `${filename}.csv`);
}

/**
 * Exports data to Excel workbook (.xlsx) or triggers a background CSV export job if moduleId is specified.
 */
export async function exportReportExcel({
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

  const resolvedCols = columns || sourceColumns || [];

  if (moduleId) {
    runGridCsvExportJob({
      moduleId,
      label: exportLabel || title,
      filename,
      columns: resolvedCols.length > 0
        ? resolvedCols
        : (sourceHeaders || Object.keys(rows[0] || {})).map((h) => ({ header: h, key: h })),
      rows,
    });
    return;
  }

  try {
    const XLSX = await import("xlsx");
    const { mappedObjects } = extractExportTable(columns || sourceColumns, rows, sourceHeaders);
    const worksheet = XLSX.utils.json_to_sheet(mappedObjects);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}_${todayISO()}.xlsx`);
  } catch {
    downloadExcelFallback(columns || sourceColumns, rows, filename, sourceHeaders);
  }
}

/**
 * Exports data to a formatted PDF document using jsPDF and autoTable.
 */
export async function exportReportPdf({
  title,
  columns,
  rows,
  filename,
  orientation = "p",
  formatSize = "a4",
  variant = "default",
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

  const { headers: tableHeaders, data: tableData } = extractExportTable(
    columns || sourceColumns,
    rows,
    sourceHeaders,
  );

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData as (string | number)[][],
    startY: 26,
    styles: {
      fontSize:
        resolvedOrientation === "l" || resolvedOrientation === "landscape" ? 8 : 10,
    },
  });

  doc.save(`${filename}_${todayISO()}.pdf`);
}
