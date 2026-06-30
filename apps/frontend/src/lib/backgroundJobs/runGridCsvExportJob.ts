import { buildCsvContent } from '@mms/shared';
import { runCsvDownloadJob } from '@/lib/backgroundJobs/runCsvDownloadJob';

export interface GridExportColumn {
  header: string;
  key: string;
}

/** Registers a background job and downloads a grid-shaped dataset as CSV. */
export function runGridCsvExportJob(options: {
  moduleId: string;
  label: string;
  filename: string;
  columns: GridExportColumn[];
  rows: Record<string, unknown>[];
}): void {
  const header = options.columns.map((column) => column.header);
  const csvRows = options.rows.map((row) =>
    options.columns.map((column) => row[column.key] ?? ''),
  );
  runCsvDownloadJob({
    moduleId: options.moduleId,
    label: options.label,
    filename: options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`,
    rows: [header, ...csvRows],
  });
}

/** Builds CSV content for a grid without triggering download (PDF path, previews). */
export function buildGridCsvContent(
  columns: GridExportColumn[],
  rows: Record<string, unknown>[],
): string {
  const header = columns.map((column) => column.header);
  const csvRows = rows.map((row) => columns.map((column) => row[column.key] ?? ''));
  return buildCsvContent([header, ...csvRows]);
}
