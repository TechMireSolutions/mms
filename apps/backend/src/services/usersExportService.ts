import {
  USERS_MODULE_MANIFEST,
  DEFAULT_USER_EXPORT_COLUMNS,
  buildCsvContent,
  buildUsersExportRows,
  extractUserCell,
  filterUserExportColumnsForViewer,
  type UserExportColumn,
  type UsersListQuery,
  type WorkspaceUser,
} from '@mms/shared';
import {
  createModuleExportService,
  type ModuleExportQueryInput,
  type ModuleExportOptions,
  type ModuleExportResult,
} from '../lib/createModuleExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadUsersByIds, loadUsersPage } from './usersService.js';

const DEFAULT_EXPORT_COLUMNS = DEFAULT_USER_EXPORT_COLUMNS as UserExportColumn[];

export type UsersExportQueryInput = ModuleExportQueryInput<UsersListQuery>;
export type UsersExportOptions = ModuleExportOptions<UserExportColumn>;
export type UsersExportResult = ModuleExportResult;
export type UsersCsvExportOptions = UsersExportOptions;
export type UsersCsvExportResult = UsersExportResult;

async function prepareUsersExport(
  options: UsersExportOptions,
): Promise<{ columns: UserExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const columns = filterUserExportColumnsForViewer(requestedColumns);
  return { columns, context: undefined };
}

const usersCsv = createModuleExportService<
  WorkspaceUser,
  UsersExportQueryInput,
  UserExportColumn
>({
  manifest: USERS_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareUsersExport,
  loadByIds: (ids) => loadUsersByIds(ids),
  loadPage: async (query, page, limit, afterId) => {
    const pageResult = await loadUsersPage({
      ...query,
      page,
      limit,
      afterId,
      skipCount: true,
    } as never);
    return {
      rows: pageResult.users,
      hasMore: pageResult.hasMore,
      nextCursor: (pageResult as { nextCursor?: string }).nextCursor,
    };
  },
  yieldDataChunks: (users, columns, chunkSize) => {
    function* gen(): Generator<string, void, undefined> {
      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);
        const chunkExportRows = buildUsersExportRows(chunk, columns);
        const dataRows = chunkExportRows.slice(1);
        if (dataRows.length > 0) {
          yield '\n' + buildCsvContent(dataRows);
        }
      }
    }
    return gen();
  },
  extractCell: extractUserCell,
});

export const generateUsersCsvStreamChunks = usersCsv.generateStreamChunks;
export const buildUsersCsvExport = usersCsv.buildExport as (
  query: UsersExportQueryInput,
  options: UsersExportOptions,
) => Promise<UsersExportResult>;
