import {
  DEFAULT_ENROLLMENT_EXPORT_COLUMNS,
  ENROLLMENTS_MODULE_MANIFEST,
  buildCsvContent,
  buildEnrollmentsExportRows,
  filterEnrollmentExportColumnsForViewer,
  type Enrollment,
  type EnrollmentExportColumn,
  type EnrollmentsListQuery,
} from '@mms/shared';
import { createModuleCsvExportService } from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadEnrollmentsByIds, loadEnrollmentsPage } from './enrollmentService.js';

const DEFAULT_EXPORT_COLUMNS = DEFAULT_ENROLLMENT_EXPORT_COLUMNS as EnrollmentExportColumn[];

type EnrollmentsExportQueryInput = Omit<EnrollmentsListQuery, 'includeDeleted'> & {
  includeDeleted?: boolean | 'true' | 'false';
  includeIds?: Array<string | number>;
};

export type { EnrollmentsExportQueryInput };

export interface EnrollmentsCsvExportOptions {
  columns?: EnrollmentExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
}

export interface EnrollmentsCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

async function prepareEnrollmentsExport(
  options: EnrollmentsCsvExportOptions,
): Promise<{ columns: EnrollmentExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const columns = filterEnrollmentExportColumnsForViewer(requestedColumns);
  return { columns, context: undefined };
}

const enrollmentsCsv = createModuleCsvExportService<
  Enrollment,
  EnrollmentsExportQueryInput,
  EnrollmentExportColumn
>({
  manifest: ENROLLMENTS_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareEnrollmentsExport,
  loadByIds: (ids) => loadEnrollmentsByIds(ids) as Promise<Enrollment[]>,
  loadPage: async (query, page, limit) => {
    const pageResult = await loadEnrollmentsPage({
      ...query,
      page,
      limit,
    } as never);
    return {
      rows: pageResult.enrollments as Enrollment[],
      hasMore: pageResult.hasMore,
    };
  },
  yieldDataChunks: (enrollments, columns, chunkSize) => {
    function* gen(): Generator<string, void, undefined> {
      for (let i = 0; i < enrollments.length; i += chunkSize) {
        const chunk = enrollments.slice(i, i + chunkSize);
        const chunkExportRows = buildEnrollmentsExportRows(chunk, columns);
        const dataRows = chunkExportRows.slice(1);
        if (dataRows.length > 0) {
          yield '\n' + buildCsvContent(dataRows);
        }
      }
    }
    return gen();
  },
});

export const generateEnrollmentsCsvStreamChunks = enrollmentsCsv.generateStreamChunks;
export const streamEnrollmentsCsvExport = enrollmentsCsv.streamExport;
export const buildEnrollmentsCsvExport = enrollmentsCsv.buildExport as (
  query: EnrollmentsExportQueryInput,
  options: EnrollmentsCsvExportOptions,
) => Promise<EnrollmentsCsvExportResult>;
