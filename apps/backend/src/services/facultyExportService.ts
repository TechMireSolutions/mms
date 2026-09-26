import {
  FACULTY_MODULE_MANIFEST,
  DEFAULT_FACULTY_EXPORT_COLUMNS,
  buildCsvContent,
  buildFacultyExportRows,
  filterFacultyExportColumnsForViewer,
  type Faculty,
  type FacultyExportColumn,
  type FacultyListQuery,
  type FacultySettings,
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

export type FacultyExportQueryInput = ModuleExportQueryInput<FacultyListQuery>;
export type FacultyCsvExportOptions = ModuleCsvExportOptions<FacultyExportColumn>;
export type FacultyCsvExportResult = ModuleCsvExportResult;

async function prepareFacultyExport(
  options: FacultyCsvExportOptions,
): Promise<{ columns: FacultyExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0
      ? options.columns
      : DEFAULT_FACULTY_EXPORT_COLUMNS;
  const settings = (await loadFacultyFieldConfig()) as FacultySettings | null;
  const columns = filterFacultyExportColumnsForViewer(
    requestedColumns,
    settings,
    options.viewerRole,
  );
  return { columns, context: undefined };
}

const facultyCsv = createModuleCsvExportService<
  Faculty,
  FacultyExportQueryInput,
  FacultyExportColumn
>({
  manifest: FACULTY_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareFacultyExport,
  loadByIds: (ids) => loadFacultyByIds(ids) as Promise<Faculty[]>,
  loadPage: async (query, page, limit, afterId) => {
    const pageResult = await loadFacultyPage({
      ...query,
      page,
      limit,
      afterId,
      skipCount: true,
    } as never);
    const sourceList = (pageResult.faculty ?? []) as Faculty[];
    return {
      rows: sourceList,
      hasMore: pageResult.hasMore,
      nextCursor: (pageResult as { nextCursor?: string }).nextCursor,
    };
  },
  yieldDataChunks: (facultyList, columns, chunkSize) => {
    function* gen(): Generator<string, void, undefined> {
      for (let i = 0; i < facultyList.length; i += chunkSize) {
        const chunk = facultyList.slice(i, i + chunkSize);
        const chunkExportRows = buildFacultyExportRows(chunk, columns);
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
