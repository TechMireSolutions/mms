import {
  USERS_MODULE_MANIFEST,
  buildCsvContent,
  buildUsersExportRows,
  filterUserExportColumnsForViewer,
  type UserExportColumn,
  type UsersListQuery,
  type WorkspaceUser,
} from '@mms/shared';
import { createModuleCsvExportService } from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadUsersByIds, loadUsersPage } from './usersService.js';

const DEFAULT_EXPORT_COLUMNS: UserExportColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Role' },
  { id: 'status', label: 'Status' },
  { id: 'phone', label: 'Phone' },
  { id: 'lastLogin', label: 'Last login' },
  { id: 'createdDate', label: 'Created' },
  { id: 'twoFactorEnabled', label: '2FA enabled' },
];

type UsersExportQueryInput = Omit<UsersListQuery, 'includeDeleted'> & {
  includeDeleted?: boolean | 'true' | 'false';
  includeIds?: Array<string | number>;
};

export type { UsersExportQueryInput };

export interface UsersCsvExportOptions {
  columns?: UserExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
}

export interface UsersCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

async function prepareUsersExport(
  options: UsersCsvExportOptions,
): Promise<{ columns: UserExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const columns = filterUserExportColumnsForViewer(requestedColumns);
  return { columns, context: undefined };
}

const usersCsv = createModuleCsvExportService<
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
  loadPage: async (query, page, limit) => {
    const pageResult = await loadUsersPage({
      ...query,
      page,
      limit,
    } as never);
    return {
      rows: pageResult.users,
      hasMore: pageResult.hasMore,
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
});

export const generateUsersCsvStreamChunks = usersCsv.generateStreamChunks;
export const streamUsersCsvExport = usersCsv.streamExport;
export const buildUsersCsvExport = usersCsv.buildExport as (
  query: UsersExportQueryInput,
  options: UsersCsvExportOptions,
) => Promise<UsersCsvExportResult>;
