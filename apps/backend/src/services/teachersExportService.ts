import {
  TEACHERS_MODULE_MANIFEST,
  buildCsvContent,
  buildTeachersExportRows,
  filterTeacherExportColumnsForViewer,
  type Teacher,
  type TeacherExportColumn,
  type TeachersListQuery,
} from '@mms/shared';
import { createModuleCsvExportService } from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadTeachersByIds, loadTeachersPage } from './teacherService.js';

const DEFAULT_EXPORT_COLUMNS: TeacherExportColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'employeeId', label: 'Employee ID' },
  { id: 'specialization', label: 'Specialization' },
  { id: 'status', label: 'Status' },
  { id: 'qualification', label: 'Qualification' },
  { id: 'joinDate', label: 'Join date' },
];

type TeachersExportQueryInput = Omit<TeachersListQuery, 'includeDeleted'> & {
  includeDeleted?: boolean | 'true' | 'false';
  includeIds?: Array<string | number>;
};

export type { TeachersExportQueryInput };

export interface TeachersCsvExportOptions {
  columns?: TeacherExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
}

export interface TeachersCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

async function prepareTeachersExport(
  options: TeachersCsvExportOptions,
): Promise<{ columns: TeacherExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const columns = filterTeacherExportColumnsForViewer(requestedColumns);
  return { columns, context: undefined };
}

const teachersCsv = createModuleCsvExportService<
  Teacher,
  TeachersExportQueryInput,
  TeacherExportColumn
>({
  manifest: TEACHERS_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareTeachersExport,
  loadByIds: (ids) => loadTeachersByIds(ids) as Promise<Teacher[]>,
  loadPage: async (query, page, limit) => {
    const pageResult = await loadTeachersPage({
      ...query,
      page,
      limit,
    } as never);
    return {
      rows: pageResult.teachers as Teacher[],
      hasMore: pageResult.hasMore,
    };
  },
  yieldDataChunks: (teachers, columns, chunkSize) => {
    function* gen(): Generator<string, void, undefined> {
      for (let i = 0; i < teachers.length; i += chunkSize) {
        const chunk = teachers.slice(i, i + chunkSize);
        const chunkExportRows = buildTeachersExportRows(chunk, columns);
        const dataRows = chunkExportRows.slice(1);
        if (dataRows.length > 0) {
          yield '\n' + buildCsvContent(dataRows);
        }
      }
    }
    return gen();
  },
});

export const generateTeachersCsvStreamChunks = teachersCsv.generateStreamChunks;
export const streamTeachersCsvExport = teachersCsv.streamExport;
export const buildTeachersCsvExport = teachersCsv.buildExport as (
  query: TeachersExportQueryInput,
  options: TeachersCsvExportOptions,
) => Promise<TeachersCsvExportResult>;
