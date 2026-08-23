import { CONTACTS_MODULE_MANIFEST, ENROLLMENTS_MODULE_MANIFEST, MESSAGING_MODULE_MANIFEST, SESSIONS_MODULE_MANIFEST, STUDENTS_MODULE_MANIFEST, TEACHERS_MODULE_MANIFEST, USERS_MODULE_MANIFEST } from '@mms/shared';
import type { ContactExportColumn, EnrollmentExportColumn, MessagingCsvExportQueryDto, SessionExportColumn, StudentExportColumn, TeacherExportColumn } from '@mms/shared';
import type { ContactsExportQueryInput } from './contactsExportService.js';
import { buildContactsCsvExport } from './contactsExportService.js';
import { buildContactsVcfExport } from './contactsVcfExportService.js';
import type { StudentsExportQueryInput } from './studentsExportService.js';
import { buildStudentsCsvExport } from './studentsExportService.js';
import type { TeachersExportQueryInput } from './teachersExportService.js';
import { buildTeachersCsvExport } from './teachersExportService.js';
import type { SessionsExportQueryInput } from './sessionsExportService.js';
import { buildSessionsCsvExport } from './sessionsExportService.js';
import type { EnrollmentsExportQueryInput } from './enrollmentsExportService.js';
import { buildEnrollmentsCsvExport } from './enrollmentsExportService.js';
import type { UsersExportQueryInput } from './usersExportService.js';
import { buildUsersCsvExport } from './usersExportService.js';
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

export interface SessionsExportJobPayload {
  query?: SessionsExportQueryInput;
  columns?: SessionExportColumn[];
  filename?: string;
  label?: string;
  viewerRole: string;
  allowDeleted?: boolean;
}

export interface TeachersExportJobPayload {
  query?: TeachersExportQueryInput;
  columns?: TeacherExportColumn[];
  filename?: string;
  label?: string;
  viewerRole: string;
  allowDeleted?: boolean;
}

export interface EnrollmentsExportJobPayload {
  query?: EnrollmentsExportQueryInput;
  columns?: EnrollmentExportColumn[];
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
  const teachersModuleId = TEACHERS_MODULE_MANIFEST.moduleId;
  const sessionsModuleId = SESSIONS_MODULE_MANIFEST.moduleId;

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

  registerModuleCsvExportJobRunner({
    moduleId: sessionsModuleId,
    entityNounPlural: 'sessions',
    buildExport: (query, options) =>
      buildSessionsCsvExport(query as SessionsExportQueryInput, {
        columns: options.columns as SessionExportColumn[] | undefined,
        filename: options.filename,
        viewerRole: options.viewerRole,
        allowDeleted: options.allowDeleted,
      }),
  });

  registerModuleCsvExportJobRunner({
    moduleId: teachersModuleId,
    entityNounPlural: 'teachers',
    buildExport: (query, options) =>
      buildTeachersCsvExport(query as TeachersExportQueryInput, {
        columns: options.columns as TeacherExportColumn[] | undefined,
        filename: options.filename,
        viewerRole: options.viewerRole,
        allowDeleted: options.allowDeleted,
      }),
  });

  registerModuleCsvExportJobRunner({
    moduleId: ENROLLMENTS_MODULE_MANIFEST.moduleId,
    entityNounPlural: 'enrollments',
    buildExport: (query, options) =>
      buildEnrollmentsCsvExport(query as EnrollmentsExportQueryInput, {
        columns: options.columns as EnrollmentExportColumn[] | undefined,
        filename: options.filename,
        viewerRole: options.viewerRole,
        allowDeleted: options.allowDeleted,
      }),
  });

  registerModuleCsvExportJobRunner({
    moduleId: USERS_MODULE_MANIFEST.moduleId,
    entityNounPlural: 'users',
    buildExport: (query, options) =>
      buildUsersCsvExport(query as UsersExportQueryInput, {
        columns: options.columns as import('@mms/shared').UserExportColumn[] | undefined,
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

  // Phase 6: Headless BiDi Document Engine & Streaming Excel exports
  registerBackgroundJobRunner('students:render-report-card', async (payload, ctx) => {
    const { processPdfRenderJob } = await import('../worker/processors/pdf-rendering.js');
    await ctx.updateProgress(10, 100);
    const data = (payload as { data: Record<string, unknown>; filename?: string }).data || {};
    const filename = (payload as { filename?: string }).filename || 'report-card.pdf';
    const result = await processPdfRenderJob(
      ctx.tenant,
      {
        template: 'report-card',
        data,
        filename,
      },
      async (pct) => ctx.updateProgress(pct, 100)
    );
    await ctx.complete({
      label: `Generated Report Card (${result.key})`,
      progress: { current: 100, total: 100 },
      hasDownload: true,
    });
  });

  registerBackgroundJobRunner('finance:render-receipt', async (payload, ctx) => {
    const { processPdfRenderJob } = await import('../worker/processors/pdf-rendering.js');
    await ctx.updateProgress(10, 100);
    const data = (payload as { data: Record<string, unknown>; filename?: string }).data || {};
    const filename = (payload as { filename?: string }).filename || 'fee-receipt.pdf';
    const result = await processPdfRenderJob(
      ctx.tenant,
      {
        template: 'fee-receipt',
        data,
        filename,
      },
      async (pct) => ctx.updateProgress(pct, 100)
    );
    await ctx.complete({
      label: `Generated Fee Receipt (${result.key})`,
      progress: { current: 100, total: 100 },
      hasDownload: true,
    });
  });

  registerBackgroundJobRunner('finance:render-ledger', async (payload, ctx) => {
    const { processPdfRenderJob } = await import('../worker/processors/pdf-rendering.js');
    await ctx.updateProgress(10, 100);
    const data = (payload as { data: Record<string, unknown>; filename?: string }).data || {};
    const filename = (payload as { filename?: string }).filename || 'financial-ledger.pdf';
    const result = await processPdfRenderJob(
      ctx.tenant,
      {
        template: 'financial-ledger',
        data,
        filename,
      },
      async (pct) => ctx.updateProgress(pct, 100)
    );
    await ctx.complete({
      label: `Generated Financial Ledger (${result.key})`,
      progress: { current: 100, total: 100 },
      hasDownload: true,
    });
  });

  registerBackgroundJobRunner('finance:export-excel', async (payload, ctx) => {
    const { streamLedgerToS3 } = await import('../worker/processors/excel-export.js');
    const { filename = 'ledger-export.xlsx', entries = [] } = payload as {
      filename?: string;
      entries?: Record<string, unknown>[];
    };

    async function* generateRows() {
      for (const entry of entries) {
        yield entry;
      }
    }

    await ctx.updateProgress(10, 100);
    const key = await streamLedgerToS3(ctx.tenant, filename, generateRows());
    await ctx.complete({
      label: `Streamed Ledger to Excel (${key})`,
      progress: { current: 100, total: 100 },
      hasDownload: true,
    });
  });
}

