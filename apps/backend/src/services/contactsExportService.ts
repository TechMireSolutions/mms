import {
  CONTACTS_MODULE_MANIFEST,
  buildContactsExportRows,
  buildCsvContent,
  filterContactExportColumnsForViewer,
  sanitizeContactsForViewer,
  type Contact,
  type ContactExportColumn,
  type ContactsListQuery,
  type FieldConfig,
} from '@mms/shared';
import { createModuleCsvExportService } from '../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../lib/csvExportStreamFactory.js';
import { loadContactsByIds, loadContactsPage } from './contactService.js';
import { loadContactFieldConfig } from './contactConfigService.js';

const DEFAULT_EXPORT_COLUMNS: ContactExportColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'gender', label: 'Gender' },
  { id: 'city', label: 'City' },
];

const EXPORT_LABELS = { yes: 'Yes', no: 'No' };

type ContactsExportQueryInput = Omit<ContactsListQuery, 'includeDeleted'> & {
  includeDeleted?: ContactsListQuery['includeDeleted'] | 'true' | 'false';
};

export type { ContactsExportQueryInput };

export interface ContactsCsvExportOptions {
  columns?: ContactExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
}

export interface ContactsCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

type ContactsExportContext = {
  viewerRole: string;
  fieldConfig: FieldConfig | null;
};

async function prepareContactsExport(
  options: ContactsCsvExportOptions,
): Promise<{ columns: ContactExportColumn[]; context: ContactsExportContext }> {
  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const config = await loadContactFieldConfig();
  const fieldConfig: FieldConfig | null = config?.fields
    ? (config.formTabs
        ? config
        : { ...config, formTabs: [], enabledTabs: [], requiredTabs: [], version: config.version ?? 1 })
    : null;
  const columns = filterContactExportColumnsForViewer(
    requestedColumns,
    fieldConfig,
    options.viewerRole,
  );
  return {
    columns,
    context: { viewerRole: options.viewerRole, fieldConfig },
  };
}

const contactsCsv = createModuleCsvExportService<
  Contact,
  ContactsExportQueryInput,
  ContactExportColumn,
  ContactsExportContext
>({
  manifest: CONTACTS_MODULE_MANIFEST,
  normalizeQuery: (query, allowDeleted) => ({
    ...query,
    includeDeleted: normalizeIncludeDeletedFlag(query.includeDeleted, allowDeleted),
  }),
  prepareExport: prepareContactsExport,
  loadByIds: loadContactsByIds,
  loadPage: async (query, page, limit) => {
    const pageResult = await loadContactsPage({
      ...query,
      page,
      limit,
    } as never);
    return {
      rows: pageResult.contacts as Contact[],
      hasMore: pageResult.hasMore,
    };
  },
  yieldDataChunks: (contacts, columns, chunkSize, context) => {
    const sanitizeSnapshot = context.fieldConfig
      ? { fields: context.fieldConfig.fields, tabs: context.fieldConfig.formTabs ?? [] }
      : null;

    function* gen(): Generator<string, void, undefined> {
      for (let i = 0; i < contacts.length; i += chunkSize) {
        const chunk = contacts.slice(i, i + chunkSize);
        const sanitizedChunk = sanitizeSnapshot
          ? sanitizeContactsForViewer(chunk, context.viewerRole, sanitizeSnapshot)
          : chunk;
        const chunkExportRows = buildContactsExportRows(sanitizedChunk, columns, EXPORT_LABELS);
        const dataRows = chunkExportRows.slice(1);
        if (dataRows.length > 0) {
          yield '\n' + buildCsvContent(dataRows);
        }
      }
    }
    return gen();
  },
});

export const generateContactsCsvStreamChunks = contactsCsv.generateStreamChunks;
export const streamContactsCsvExport = contactsCsv.streamExport;
export const buildContactsCsvExport = contactsCsv.buildExport as (
  query: ContactsExportQueryInput,
  options: ContactsCsvExportOptions,
) => Promise<ContactsCsvExportResult>;
