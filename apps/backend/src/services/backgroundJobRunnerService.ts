import { CONTACTS_MODULE_MANIFEST, MESSAGING_MODULE_MANIFEST, STUDENTS_MODULE_MANIFEST } from '@mms/shared';
import type { ContactExportColumn, MessagingCsvExportQueryDto, StudentExportColumn } from '@mms/shared';
import type { ContactsExportQueryInput } from './contactsExportService.js';
import { buildContactsCsvExport } from './contactsExportService.js';
import { buildContactsVcfExport } from './contactsVcfExportService.js';
import type { StudentsExportQueryInput } from './studentsExportService.js';
import { buildStudentsCsvExport } from './studentsExportService.js';
import { buildMessagingCsvExport } from './messagingExportService.js';
import { saveExportArtifact } from './exportArtifactService.js';
import { runContactsDuplicateScan } from './contactDuplicateScanService.js';
import { registerBackgroundJobRunner } from './backgroundJobWorkerService.js';
import { registerModuleCsvExportJobRunner } from '../lib/registerModuleCsvExportJobRunner.js';

export interface ContactsExportJobPayload {
  query?: ContactsExportQueryInput;
  columns?: ContactExportColumn[];
  filename?: string;
  label?: string;
  viewerRole: string;
  /** Enqueue-time privilege — runner must not honor includeDeleted without this. */
  allowDeleted?: boolean;
}

export interface ContactsVcfExportJobPayload {
  filename?: string;
  label?: string;
}

export interface StudentsExportJobPayload {
  query?: StudentsExportQueryInput;
  columns?: StudentExportColumn[];
  filename?: string;
  label?: string;
  viewerRole: string;
  allowDeleted?: boolean;
}

export interface MessagingExportJobPayload {
  query?: MessagingCsvExportQueryDto;
  filename?: string;
  label?: string;
}

export function registerDefaultBackgroundJobRunners(): void {
  const contactsModuleId = CONTACTS_MODULE_MANIFEST.moduleId;
  const messagingModuleId = MESSAGING_MODULE_MANIFEST.moduleId;
  const studentsModuleId = STUDENTS_MODULE_MANIFEST.moduleId;

  registerModuleCsvExportJobRunner({
    moduleId: contactsModuleId,
    entityNounPlural: 'contacts',
    buildExport: (query, options) =>
      buildContactsCsvExport(query as ContactsExportQueryInput, {
        columns: options.columns as ContactExportColumn[] | undefined,
        filename: options.filename,
        viewerRole: options.viewerRole,
        allowDeleted: options.allowDeleted,
      }),
  });

  registerBackgroundJobRunner(`${contactsModuleId}:export-vcf`, async (payload, ctx) => {
    const exportPayload = payload as ContactsVcfExportJobPayload;
    await ctx.updateProgress(0, 1);
    const { vcf, filename, count } = await buildContactsVcfExport({
      filename: exportPayload.filename,
      onProgress: (processed, total) => ctx.updateProgress(processed, Math.max(total, 1)),
    });
    await saveExportArtifact(ctx.userId, ctx.jobId, vcf, filename);
    await ctx.complete({
      label: exportPayload.label ?? `Exported ${count} contacts`,
      progress: { current: count, total: count },
      hasDownload: true,
    });
  });

  registerBackgroundJobRunner(`${contactsModuleId}:duplicate-scan`, async (_payload, ctx) => {
    const result = await runContactsDuplicateScan(async (processed, total) => {
      await ctx.updateProgress(processed, total);
    });
    await ctx.complete({
      label: `Found ${result.pairCount} duplicate pairs`,
      progress: { current: result.pairCount, total: Math.max(result.pairCount, 1) },
    });
  });

  registerModuleCsvExportJobRunner({
    moduleId: studentsModuleId,
    entityNounPlural: 'students',
    buildExport: (query, options) =>
      buildStudentsCsvExport(query as StudentsExportQueryInput, {
        columns: options.columns as StudentExportColumn[] | undefined,
        filename: options.filename,
        viewerRole: options.viewerRole,
        allowDeleted: options.allowDeleted,
      }),
  });

  registerBackgroundJobRunner(`${messagingModuleId}:export`, async (payload, ctx) => {
    const exportPayload = payload as MessagingExportJobPayload;
    await ctx.updateProgress(0, 1);
    const { csv, filename, count } = await buildMessagingCsvExport(
      ctx.tenant,
      exportPayload.query ?? {},
      {
        filename: exportPayload.filename,
        onProgress: (current, total) => ctx.updateProgress(current, total),
      },
    );
    await saveExportArtifact(ctx.userId, ctx.jobId, csv, filename);
    await ctx.complete({
      label: exportPayload.label ?? `Exported ${count} message logs`,
      progress: { current: count, total: count },
      hasDownload: true,
    });
  });
}
