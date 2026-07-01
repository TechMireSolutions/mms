import { buildCsvContent } from '@mms/shared';
import {
  completeBackgroundJob,
  failBackgroundJob,
  startBackgroundJob,
} from '@/lib/backgroundJobs/backgroundJobStore';

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Registers a background job and downloads a CSV (cross-module export helper). */
export function runCsvDownloadJob(options: {
  moduleId: string;
  label: string;
  filename: string;
  rows: unknown[][];
}): void {
  const jobId = startBackgroundJob(options.moduleId, 'export', options.label, options.rows.length);
  try {
    triggerDownload(buildCsvContent(options.rows), options.filename);
    completeBackgroundJob(jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    failBackgroundJob(jobId, message);
    throw error;
  }
}
