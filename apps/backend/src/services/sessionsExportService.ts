import {
  DEFAULT_SESSION_EXPORT_COLUMNS,
  SESSIONS_MODULE_MANIFEST,
  buildCsvContent,
  buildSessionsExportRows,
  filterSessionExportColumnsForViewer,
  type Session,
  type SessionExportColumn,
  type SessionsListQuery,
  type SessionsSettings,
} from '@mms/shared';
import { createModuleCsvExportService } from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadSessionsSettingsCombined } from './sessionConfigService.js';
import { loadSessionsByIds, loadSessionsPage } from './sessionService.js';

const DEFAULT_EXPORT_COLUMNS = DEFAULT_SESSION_EXPORT_COLUMNS as SessionExportColumn[];

type SessionsExportQueryInput = Omit<SessionsListQuery, 'includeDeleted'> & {
  includeDeleted?: SessionsListQuery['includeDeleted'] | 'true' | 'false';
  includeIds?: Array<string | number>;
};

export type { SessionsExportQueryInput };

export interface SessionsCsvExportOptions {
  columns?: SessionExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
}

export interface SessionsCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

async function loadSessionsFieldSettings(): Promise<SessionsSettings | null> {
  try {
    return await loadSessionsSettingsCombined();
  } catch {
    return null;
  }
}

async function prepareSessionsExport(
  options: SessionsCsvExportOptions,
): Promise<{ columns: SessionExportColumn[]; context: undefined }> {
  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const settings = await loadSessionsFieldSettings();
  const columns = filterSessionExportColumnsForViewer(requestedColumns, settings);
  return { columns, context: undefined };
}

const sessionsCsv = createModuleCsvExportService<
  Session,
  SessionsExportQueryInput,
  SessionExportColumn
>({
  manifest: SESSIONS_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareSessionsExport,
  loadByIds: loadSessionsByIds,
  loadPage: async (query, page, limit) => {
    const pageResult = await loadSessionsPage({
      ...query,
      page,
      limit,
    } as never);
    return {
      rows: pageResult.sessions as Session[],
      hasMore: pageResult.hasMore,
    };
  },
  yieldDataChunks: (sessionRows, columns, chunkSize) => {
    function* gen(): Generator<string, void, undefined> {
      for (let i = 0; i < sessionRows.length; i += chunkSize) {
        const chunk = sessionRows.slice(i, i + chunkSize);
        const chunkExportRows = buildSessionsExportRows(chunk, columns);
        const dataRows = chunkExportRows.slice(1);
        if (dataRows.length > 0) {
          yield '\n' + buildCsvContent(dataRows);
        }
      }
    }
    return gen();
  },
});

export const generateSessionsCsvStreamChunks = sessionsCsv.generateStreamChunks;
export const streamSessionsCsvExport = sessionsCsv.streamExport;
export const buildSessionsCsvExport = sessionsCsv.buildExport as (
  query: SessionsExportQueryInput,
  options: SessionsCsvExportOptions,
) => Promise<SessionsCsvExportResult>;
