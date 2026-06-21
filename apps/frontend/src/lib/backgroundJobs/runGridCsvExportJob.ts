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
  const header = options.columns.map((c) => c.header);
  const data = options.rows.map((row) =>
    options.columns.map((c) => row[c.key] ?? ''),
  );
  runCsvDownloadJob({
    moduleId: options.moduleId,
    label: options.label,
    filename: options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`,
    rows: [header, ...data],
  });
}

/** Builds CSV content for a grid without triggering download (PDF path, previews). */
export function buildGridCsvContent(
  columns: GridExportColumn[],
  rows: Record<string, unknown>[],
): string {
  const header = columns.map((c) => c.header);
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''));
  return buildCsvContent([header, ...data]);
}
