import {
  buildContactsExportRows,
  buildCsvContent,
  filterContactExportColumnsForViewer,
  listAllContactsForQuery,
  sanitizeContactsForViewer,
  type Contact,
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
  { id: 'lifecycleStage', label: 'Stage' },
  { id: 'gender', label: 'Gender' },
  { id: 'city', label: 'City' },
];

const EXPORT_LABELS = { yes: 'Yes', no: 'No' };

type ContactsExportQueryInput = Omit<ContactsListQuery, 'includeDeleted'> & {
  includeDeleted?: ContactsListQuery['includeDeleted'] | 'true' | 'false';
};

export type { ContactsExportQueryInput };

function normalizeListQuery(query: ContactsExportQueryInput): ContactsListQuery {
  const includeDeleted =
    query.includeDeleted === true || query.includeDeleted === 'true'
      ? true
      : query.includeDeleted === false || query.includeDeleted === 'false'
        ? false
        : undefined;
  return { ...query, includeDeleted };
}

async function sanitizeForRole(contacts: Contact[], role: string): Promise<Contact[]> {
  const cfg = await loadContactFieldConfig();
  if (!cfg?.fields) return contacts;
  const fieldConfig: FieldConfig = cfg.formTabs
    ? cfg
    : { ...cfg, formTabs: [], enabledTabs: [], requiredTabs: [], version: cfg.version ?? 1 };
  return sanitizeContactsForViewer(contacts, role, {
    fields: fieldConfig.fields,
    tabs: fieldConfig.formTabs ?? [],
  });
}

export interface ContactsCsvExportResult {
  csv: string;
  filename: string;
  count: number;
}

export async function buildContactsCsvExport(
  query: ContactsExportQueryInput,
  options: {
    columns?: ContactExportColumn[];
    filename?: string;
    viewerRole: string;
  },
): Promise<ContactsCsvExportResult> {
  const normalized = normalizeListQuery(query);
  const all = await loadContacts({ includeDeleted: normalized.includeDeleted });
  let rows = listAllContactsForQuery(all, normalized);
  rows = await sanitizeForRole(rows, options.viewerRole);

  const requestedColumns =
    options.columns && options.columns.length > 0 ? options.columns : DEFAULT_EXPORT_COLUMNS;
  const cfg = await loadContactFieldConfig();
  const fieldConfig = cfg?.fields
    ? (cfg.formTabs
        ? cfg
        : { ...cfg, formTabs: [], enabledTabs: [], requiredTabs: [], version: cfg.version ?? 1 })
    : null;
  const columns = filterContactExportColumnsForViewer(requestedColumns, fieldConfig, options.viewerRole);
  const csv = buildCsvContent(buildContactsExportRows(rows, columns, EXPORT_LABELS));
  const filename = options.filename?.trim() || 'contacts_export.csv';

  return { csv, filename, count: rows.length };
}
