import { CONTACTS_MODULE_CONTRACT } from '@mms/shared';
import type { ContactExportColumn } from '@mms/shared';
import type { ContactsExportQueryInput } from './contactsExportService.js';
import { buildContactsCsvExport } from './contactsExportService.js';
import { saveExportArtifact } from './exportArtifactService.js';
import { runContactsDuplicateScan } from './contactDuplicateScanService.js';
import { registerBackgroundJobRunner } from './backgroundJobWorkerService.js';

export interface ContactsExportJobPayload {
  query?: ContactsExportQueryInput;
  columns?: ContactExportColumn[];
  filename?: string;
  label?: string;
  viewerRole: string;
}

export function registerDefaultBackgroundJobRunners(): void {
  const moduleId = CONTACTS_MODULE_CONTRACT.moduleId;

  registerBackgroundJobRunner(`${moduleId}:export`, async (payload, ctx) => {
    const data = payload as ContactsExportJobPayload;
    await ctx.updateProgress(0, 1);
    const { csv, filename, count } = await buildContactsCsvExport(data.query ?? {}, {
      columns: data.columns,
      filename: data.filename,
      viewerRole: data.viewerRole,
    });
    await saveExportArtifact(ctx.userId, ctx.jobId, csv, filename);
    await ctx.complete({
      label: data.label ?? `Exported ${count} contacts`,
      progress: { current: count, total: count },
      hasDownload: true,
    });
  });

  registerBackgroundJobRunner(`${moduleId}:duplicate-scan`, async (_payload, ctx) => {
    const result = await runContactsDuplicateScan(async (processed, total) => {
      await ctx.updateProgress(processed, total);
    });
    await ctx.complete({
      label: `Found ${result.pairCount} duplicate pairs`,
      progress: { current: result.pairCount, total: Math.max(result.pairCount, 1) },
    });
  });
}
