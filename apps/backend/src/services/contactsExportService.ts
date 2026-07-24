import { Readable } from 'node:stream';
import {
  buildContactsExportRows,
  buildCsvContent,
  filterContactExportColumnsForViewer,
  listAllContactsForQuery,
  sanitizeContactsForViewer,
  type ContactExportColumn,
  type ContactsListQuery,
  type FieldConfig,
} from '@mms/shared';
import { loadContacts } from './contactService.js';
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
}

export interface ContactsCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

function normalizeListQuery(query: ContactsExportQueryInput): ContactsListQuery {
  const includeDeleted =
    query.includeDeleted === true || query.includeDeleted === 'true'
      ? true
      : query.includeDeleted === false || query.includeDeleted === 'false'
        ? false
        : undefined;
  return { ...query, includeDeleted };
}

/**
 * Async generator yielding CSV chunks for contacts export.
 * Reduces peak memory allocation by sanitizing and building CSV rows chunk-by-chunk.
 */
export async function* generateContactsCsvStreamChunks(
  query: ContactsExportQueryInput,
  options: ContactsCsvExportOptions,
): AsyncGenerator<string, { count: number; filename: string }, undefined> {
  const normalized = normalizeListQuery(query);
  const all = await loadContacts({ includeDeleted: normalized.includeDeleted });
  const rows = listAllContactsForQuery(all, normalized);

  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const config = await loadContactFieldConfig();
  const fieldConfig: FieldConfig | null = config?.fields
    ? (config.formTabs
        ? config
        : { ...config, formTabs: [], enabledTabs: [], requiredTabs: [], version: config.version ?? 1 })
    : null;
  const columns = filterContactExportColumnsForViewer(requestedColumns, fieldConfig, options.viewerRole);

  const filename = options.filename?.trim() || 'contacts_export.csv';
  const chunkSize = Math.max(1, options.chunkSize ?? DEFAULT_CHUNK_SIZE);

  // Yield CSV header row chunk
  const headerRow = columns.map((col) => col.label);
  yield buildCsvContent([headerRow]);

  if (rows.length === 0) {
    return { count: 0, filename };
  }

  const sanitizeSnapshot = fieldConfig
    ? { fields: fieldConfig.fields, tabs: fieldConfig.formTabs ?? [] }
    : null;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const sanitizedChunk = sanitizeSnapshot
      ? sanitizeContactsForViewer(chunk, options.viewerRole, sanitizeSnapshot)
      : chunk;

    const chunkExportRows = buildContactsExportRows(sanitizedChunk, columns, EXPORT_LABELS);
    // Index 0 is the chunk header; data rows follow at slice(1)
    const dataRows = chunkExportRows.slice(1);
    if (dataRows.length > 0) {
      yield '\n' + buildCsvContent(dataRows);
    }
  }

  return { count: rows.length, filename };
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
