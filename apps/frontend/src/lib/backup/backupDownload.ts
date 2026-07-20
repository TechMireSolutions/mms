import { triggerFileDownload } from "@/lib/download";

/** Triggers a browser download of JSON backup text. */
export function triggerBackupDownload(fileName: string, jsonText: string): void {
  const blob = new Blob([jsonText], { type: 'application/json' });
  triggerFileDownload(blob, fileName);
}
