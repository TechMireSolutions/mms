import { saveExportArtifact } from '../services/exportArtifactService.js';
import { registerBackgroundJobRunner } from '../services/backgroundJobWorkerService.js';

export type ModuleCsvExportJobPayload = {
  query?: unknown;
  columns?: unknown;
  filename?: string;
  label?: string;
  viewerRole: string;
  allowDeleted?: boolean;
};

export type RegisterModuleCsvExportJobRunnerOptions = {
  moduleId: string;
  entityNounPlural: string;
  buildExport: (
    query: Record<string, unknown>,
    options: {
      columns?: unknown;
      filename?: string;
      viewerRole: string;
      allowDeleted?: boolean;
    },
  ) => Promise<{ csv: string; filename: string; count: number }>;
};

/** Register `${moduleId}:export` CSV background job runner (Contacts/Students). */
export function registerModuleCsvExportJobRunner(
  options: RegisterModuleCsvExportJobRunnerOptions,
): void {
  registerBackgroundJobRunner(`${options.moduleId}:export`, async (payload, ctx) => {
    const exportPayload = payload as ModuleCsvExportJobPayload;
    await ctx.updateProgress(0, 1);
    const { csv, filename, count } = await options.buildExport(
      (exportPayload.query ?? {}) as Record<string, unknown>,
      {
        columns: exportPayload.columns,
        filename: exportPayload.filename,
        viewerRole: exportPayload.viewerRole,
        allowDeleted: exportPayload.allowDeleted === true,
      },
    );
    await saveExportArtifact(ctx.userId, ctx.jobId, csv, filename);
    await ctx.complete({
      label: exportPayload.label ?? `Exported ${count} ${options.entityNounPlural}`,
      progress: { current: count, total: count },
      hasDownload: true,
    });
  });
}
