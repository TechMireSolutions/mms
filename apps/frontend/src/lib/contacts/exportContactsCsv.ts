import type { Contact } from "@mms/shared";
import {
  buildContactsExportRows,
  buildCsvContent,
  type ContactExportColumn,
  type ContactExportLabels,
} from "@mms/shared";

export type { ContactExportColumn, ContactExportLabels };

/** Triggers a browser download of contacts as CSV. */
export function downloadContactsCsv(
  contacts: Contact[],
  columns: ContactExportColumn[],
  labels: ContactExportLabels,
  filename: string,
): void {
  const csv = buildCsvContent(buildContactsExportRows(contacts, columns, labels));
  triggerCsvDownload(csv, filename);
}

function triggerCsvDownload(csv: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Chunked CSV export for large directories (globle1 §8).
 * Yields between chunks so the UI stays responsive.
 */
export async function downloadContactsCsvChunked(
  contacts: Contact[],
  columns: ContactExportColumn[],
  labels: ContactExportLabels,
  filename: string,
  options?: {
    chunkSize?: number;
    onProgress?: (processed: number, total: number) => void;
  },
): Promise<void> {
  const chunkSize = options?.chunkSize ?? 100;
  const header = columns.map((column) => column.label);
  const rows: unknown[][] = [header];

  for (let i = 0; i < contacts.length; i += chunkSize) {
    const slice = contacts.slice(i, i + chunkSize);
    const chunkRows = buildContactsExportRows(slice, columns, labels);
    rows.push(...chunkRows.slice(1));
    options?.onProgress?.(Math.min(i + chunkSize, contacts.length), contacts.length);
    await yieldToMain();
  }

  triggerCsvDownload(buildCsvContent(rows), filename);
}
