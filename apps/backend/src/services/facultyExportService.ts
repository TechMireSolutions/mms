import {
  TEACHERS_MODULE_MANIFEST,
  DEFAULT_TEACHER_EXPORT_COLUMNS,
  buildCsvContent,
  buildTeachersExportRows,
  filterTeacherExportColumnsForViewer,
  type Teacher,
  type TeacherExportColumn,
  type TeachersListQuery,
  type TeachersSettings,
} from '@mms/shared';
import {
  createModuleCsvExportService,
  type ModuleExportQueryInput,
  type ModuleCsvExportOptions,
  type ModuleCsvExportResult,
} from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadFacultyFieldConfig } from './facultyConfigService.js';
import { loadFacultyByIds, loadFacultyPage } from './facultyService.js';

export type FacultyExportQueryInput = ModuleExportQueryInput<TeachersListQuery>;
export type FacultyCsvExportOptions = ModuleCsvExportOptions<TeacherExportColumn>;
export type FacultyCsvExportResult = ModuleCsvExportResult;

export type TeachersExportQueryInput = FacultyExportQueryInput;
export type TeachersCsvExportOptions = FacultyCsvExportOptions;
export type TeachersCsvExportResult = FacultyCsvExportResult;

async function prepareFacultyExport(
  options: FacultyCsvExportOptions,
): Promise<{ columns: TeacherExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0
      ? options.columns
      : DEFAULT_TEACHER_EXPORT_COLUMNS;
  const settings = (await loadFacultyFieldConfig()) as TeachersSettings | null;
  const columns = filterTeacherExportColumnsForViewer(
    requestedColumns,
    settings,
    options.viewerRole,
  );
  return { columns, context: undefined };
}

const facultyCsv = createModuleCsvExportService<
  Teacher,
  FacultyExportQueryInput,
  TeacherExportColumn
>({
  manifest: TEACHERS_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareFacultyExport,
  loadByIds: (ids) => loadFacultyByIds(ids) as Promise<Teacher[]>,
  loadPage: async (query, page, limit, afterId) => {
    const pageResult = await loadFacultyPage({
      ...query,
      page,
      limit,
      afterId,
      skipCount: true,
    } as never);
    return {
      rows: pageResult.teachers as Teacher[],
      hasMore: pageResult.hasMore,
      nextCursor: (pageResult as { nextCursor?: string }).nextCursor,
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

export const generateFacultyCsvStreamChunks = facultyCsv.generateStreamChunks;
export const buildFacultyCsvExport = facultyCsv.buildExport as (
  query: FacultyExportQueryInput,
  options: FacultyCsvExportOptions,
) => Promise<FacultyCsvExportResult>;

export const generateTeachersCsvStreamChunks = generateFacultyCsvStreamChunks;
export const buildTeachersCsvExport = buildFacultyCsvExport;
