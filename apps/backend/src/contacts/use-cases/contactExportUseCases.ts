import {
  CONTACTS_MODULE_MANIFEST,
  DEFAULT_CONTACT_EXPORT_COLUMNS,
  buildContactsExportRows,
  buildCsvContent,
  filterContactExportColumnsForViewer,
  sanitizeContactsForViewer,
  toVCard,
  type Contact,
  type ContactExportColumn,
  type ContactsListQuery,
  type FieldConfig,
} from '@mms/shared';
import { createModuleCsvExportService } from '../../lib/createModuleCsvExportService.js';
import { normalizeIncludeDeletedFlag } from '../../lib/csvExportStreamFactory.js';
import { loadContactsByIds, loadContactsPage } from './contactLoadUseCases.js';
import { loadContactFieldConfig } from './contactConfigService.js';

const DEFAULT_EXPORT_COLUMNS = DEFAULT_CONTACT_EXPORT_COLUMNS as ContactExportColumn[];

const EXPORT_LABELS = { yes: 'Yes', no: 'No' };

type ContactsExportQueryInput = Omit<ContactsListQuery, 'includeDeleted'> & {
  includeDeleted?: ContactsListQuery['includeDeleted'] | 'true' | 'false';
};

export type { ContactsExportQueryInput };

interface ContactsCsvExportOptions {
  columns?: ContactExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  allowDeleted?: boolean;
}

interface ContactsCsvExportResult {
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

export const buildContactsCsvExport = contactsCsv.buildExport as (
  query: ContactsExportQueryInput,
  options: ContactsCsvExportOptions,
) => Promise<ContactsCsvExportResult>;

const VCF_PAGE_SIZE = 500;

export interface ContactsVcfExportResult {
  vcf: string;
  filename: string;
  count: number;
}

/**
 * Streams a tenant VCF export page-by-page as chunk strings.
 */
export async function* generateContactsVcfStreamChunks(options?: {
  filename?: string;
  chunkSize?: number;
  onProgress?: (processed: number, total: number) => void | Promise<void>;
}): AsyncGenerator<string, { count: number; filename: string }, undefined> {
  const filename = options?.filename?.trim() || 'contacts.vcf';
  const limit = Math.max(1, options?.chunkSize ?? VCF_PAGE_SIZE);
  let page = 1;
  let count = 0;

  for (;;) {
    const pageResult = await loadContactsPage({
      page,
      limit,
      includeDeleted: false,
    } as never);
    const contacts = pageResult.contacts as Contact[];
    if (contacts.length > 0) {
      const chunk = contacts.map(toVCard).join('\r\n');
      yield count === 0 ? chunk : '\r\n' + chunk;
      count += contacts.length;
    }
    await options?.onProgress?.(count, pageResult.total);
    if (!pageResult.hasMore) {
      return { count, filename };
    }
    page += 1;
  }
}

/**
 * Builds a tenant VCF export by SQL-paginating contacts (no full-list hydrate).
 */
export async function buildContactsVcfExport(options?: {
  filename?: string;
  chunkSize?: number;
  onProgress?: (processed: number, total: number) => void | Promise<void>;
}): Promise<ContactsVcfExportResult> {
  const generator = generateContactsVcfStreamChunks(options);
  const chunks: string[] = [];
  let step = await generator.next();
  while (!step.done) {
    chunks.push(step.value);
    step = await generator.next();
  }
  const meta = step.value;
  return {
    vcf: chunks.join(''),
    filename: meta?.filename || options?.filename?.trim() || 'contacts.vcf',
    count: meta?.count ?? 0,
  };
}
