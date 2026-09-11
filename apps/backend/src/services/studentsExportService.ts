import {
  DEFAULT_STUDENT_EXPORT_COLUMNS,
  STUDENTS_MODULE_MANIFEST,
  buildCsvContent,
  buildStudentsExportRows,
  filterStudentExportColumnsForViewer,
  type Student,
  type StudentExportColumn,
  type StudentsListQuery,
  type StudentsSettings,
} from '@mms/shared';
import {
  createModuleCsvExportService,
  type ModuleExportQueryInput,
  type ModuleCsvExportOptions,
  type ModuleCsvExportResult,
} from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadStudentFieldConfig } from './studentConfigService.js';
import { loadStudentsByIds, loadStudentsPage } from '../students/use-cases/studentUseCases.js';

const DEFAULT_EXPORT_COLUMNS = DEFAULT_STUDENT_EXPORT_COLUMNS as StudentExportColumn[];

export type StudentsExportQueryInput = ModuleExportQueryInput<StudentsListQuery>;
export type StudentsCsvExportOptions = ModuleCsvExportOptions<StudentExportColumn>;
export type StudentsCsvExportResult = ModuleCsvExportResult;

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
  loadPage: async (query, page, limit, afterId) => {
    const pageResult = await loadStudentsPage({
      ...query,
      page,
      limit,
      afterId,
      skipCount: true,
    } as never);
    return {
      rows: pageResult.students as Student[],
      hasMore: pageResult.hasMore,
      nextCursor: (pageResult as { nextCursor?: string }).nextCursor,
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
