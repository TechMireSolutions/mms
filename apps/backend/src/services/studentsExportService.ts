import {
  STUDENTS_MODULE_MANIFEST,
  buildCsvContent,
  buildStudentsExportRows,
  filterStudentExportColumnsForViewer,
  type Student,
  type StudentExportColumn,
  type StudentsListQuery,
  type StudentsSettings,
} from '@mms/shared';
import { createModuleCsvExportService } from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadStudentFieldConfig } from './studentConfigService.js';
import { loadStudentsByIds, loadStudentsPage } from '../students/use-cases/studentUseCases.js';

const DEFAULT_EXPORT_COLUMNS: StudentExportColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'grNumber', label: 'GR Number' },
  { id: 'gender', label: 'Gender' },
  { id: 'status', label: 'Status' },
  { id: 'parents', label: 'Parents' },
];

type StudentsExportQueryInput = Omit<StudentsListQuery, 'includeDeleted'> & {
  includeDeleted?: StudentsListQuery['includeDeleted'] | 'true' | 'false';
  includeIds?: Array<string | number>;
};

export type { StudentsExportQueryInput };

interface StudentsCsvExportOptions {
  columns?: StudentExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
}

interface StudentsCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

async function prepareStudentsExport(
  options: StudentsCsvExportOptions,
): Promise<{ columns: StudentExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const settings = (await loadStudentFieldConfig()) as StudentsSettings | null;
  const columns = filterStudentExportColumnsForViewer(
    requestedColumns,
    settings,
    options.viewerRole,
  );
  return { columns, context: undefined };
}

const studentsCsv = createModuleCsvExportService<
  Student,
  StudentsExportQueryInput,
  StudentExportColumn
>({
  manifest: STUDENTS_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareStudentsExport,
  loadByIds: loadStudentsByIds,
  loadPage: async (query, page, limit) => {
    const pageResult = await loadStudentsPage({
      ...query,
      page,
      limit,
    } as never);
    return {
      rows: pageResult.students as Student[],
      hasMore: pageResult.hasMore,
    };
  },
  yieldDataChunks: (students, columns, chunkSize) => {
    function* gen(): Generator<string, void, undefined> {
      for (let i = 0; i < students.length; i += chunkSize) {
        const chunk = students.slice(i, i + chunkSize);
        const chunkExportRows = buildStudentsExportRows(chunk, columns);
        const dataRows = chunkExportRows.slice(1);
        if (dataRows.length > 0) {
          yield '\n' + buildCsvContent(dataRows);
        }
      }
    }
    return gen();
  },
});

export const generateStudentsCsvStreamChunks = studentsCsv.generateStreamChunks;
export const buildStudentsCsvExport = studentsCsv.buildExport as (
  query: StudentsExportQueryInput,
  options: StudentsCsvExportOptions,
) => Promise<StudentsCsvExportResult>;
