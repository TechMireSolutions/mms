import { Readable } from 'node:stream';
import {
  buildContactsExportRows,
  buildCsvContent,
  filterContactExportColumnsForViewer,
  sanitizeContactsForViewer,
  type Contact,
  type ContactExportColumn,
  type ContactsListQuery,
  type FieldConfig,
} from '@mms/shared';
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
const DEFAULT_CHUNK_SIZE = 500;

type ContactsExportQueryInput = Omit<ContactsListQuery, 'includeDeleted'> & {
  includeDeleted?: ContactsListQuery['includeDeleted'] | 'true' | 'false';
};

export type { ContactsExportQueryInput };

export interface ContactsCsvExportOptions {
  columns?: ContactExportColumn[];
  filename?: string;
  viewerRole: string;
  chunkSize?: number;
  /** When false, force-exclude deleted rows even if query asks for them. */
  allowDeleted?: boolean;
}

export interface ContactsCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

function normalizeListQuery(
  query: ContactsExportQueryInput,
  allowDeleted = false,
): ContactsListQuery {
  const includeDeletedRaw =
    query.includeDeleted === true || query.includeDeleted === 'true'
      ? true
      : query.includeDeleted === false || query.includeDeleted === 'false'
        ? false
        : undefined;
  const includeDeleted = allowDeleted ? includeDeletedRaw : undefined;
  return { ...query, includeDeleted };
}

async function resolveExportColumns(
  options: ContactsCsvExportOptions,
): Promise<{ columns: ContactExportColumn[]; fieldConfig: FieldConfig | null }> {
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
  return { columns, fieldConfig };
}

function* yieldContactCsvDataChunks(
  contacts: Contact[],
  columns: ContactExportColumn[],
  viewerRole: string,
  fieldConfig: FieldConfig | null,
  chunkSize: number,
): Generator<string, void, undefined> {
  const sanitizeSnapshot = fieldConfig
    ? { fields: fieldConfig.fields, tabs: fieldConfig.formTabs ?? [] }
    : null;

  for (let i = 0; i < contacts.length; i += chunkSize) {
    const chunk = contacts.slice(i, i + chunkSize);
    const sanitizedChunk = sanitizeSnapshot
      ? sanitizeContactsForViewer(chunk, viewerRole, sanitizeSnapshot)
      : chunk;

    const chunkExportRows = buildContactsExportRows(sanitizedChunk, columns, EXPORT_LABELS);
    const dataRows = chunkExportRows.slice(1);
    if (dataRows.length > 0) {
      yield '\n' + buildCsvContent(dataRows);
    }
  }
}

/**
 * Async generator yielding CSV chunks for contacts export.
 * Filtered exports SQL-paginate via loadContactsPage; selection uses loadContactsByIds.
 */
export async function* generateContactsCsvStreamChunks(
  query: ContactsExportQueryInput,
  options: ContactsCsvExportOptions,
): AsyncGenerator<string, { count: number; filename: string }, undefined> {
  const normalized = normalizeListQuery(query, options.allowDeleted === true);
  const includeIds = normalized.includeIds?.map(String).filter(Boolean);
  const { columns, fieldConfig } = await resolveExportColumns(options);
  const filename = options.filename?.trim() || 'contacts_export.csv';
  const chunkSize = Math.max(1, options.chunkSize ?? DEFAULT_CHUNK_SIZE);

  yield buildCsvContent([columns.map((col) => col.label)]);

  if (includeIds && includeIds.length > 0) {
    const rows = await loadContactsByIds(includeIds);
    if (rows.length === 0) {
      return { count: 0, filename };
    }
    yield* yieldContactCsvDataChunks(rows, columns, options.viewerRole, fieldConfig, chunkSize);
    return { count: rows.length, filename };
  }

  let page = 1;
  let exported = 0;
  for (;;) {
    const pageResult = await loadContactsPage({
      ...normalized,
      page,
      limit: chunkSize,
    });
    const pageContacts = pageResult.contacts as Contact[];
    if (pageContacts.length > 0) {
      yield* yieldContactCsvDataChunks(
        pageContacts,
        columns,
        options.viewerRole,
        fieldConfig,
        chunkSize,
      );
      exported += pageContacts.length;
    }
    if (!pageResult.hasMore) {
      return { count: exported, filename };
    }
    page += 1;
  }
}

/**
 * Returns a Node.js Readable stream emitting CSV data chunks with backpressure support.
 */
export function streamContactsCsvExport(
  query: ContactsExportQueryInput,
  options: ContactsCsvExportOptions,
): Readable {
  return Readable.from(generateContactsCsvStreamChunks(query, options));
}

/**
 * Builds full CSV export using stream-backed chunk iteration to minimize peak heap allocation.
 */
export async function buildContactsCsvExport(
  query: ContactsExportQueryInput,
  options: ContactsCsvExportOptions,
): Promise<ContactsCsvExportResult> {
  const chunks: string[] = [];
  const generator = generateContactsCsvStreamChunks(query, options);

  let step = await generator.next();
  while (!step.done) {
    chunks.push(step.value);
    step = await generator.next();
  }

  const meta = step.value;
  return {
    csv: chunks.join(''),
    filename: meta?.filename || options.filename?.trim() || 'contacts_export.csv',
    count: meta?.count ?? 0,
  };
}
