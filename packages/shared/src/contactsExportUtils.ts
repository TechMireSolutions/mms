import type { Contact, FieldConfig, FieldDefinition, TabDefinition } from './contactTypes.js';
import { canViewContactColumn, resolveContactColumnField, type ContactColumnFieldContext } from './contactColumnAccess.js';
import { COLUMN_FIELD_MAPPING, DEFAULT_COLUMN_REGISTRY, DEFAULT_FORM_TABS } from './contactTabRegistry.js';
import { INITIAL_FIELD_SEED } from './contactFieldSeed.js';
import { canViewContactTab } from './contactFieldAccess.js';
import {
  isContactLockedEnabledTab,
  resolveContactEnabledTabIds,
} from './contactEnabledTabs.js';
import {
  isRelationshipContactColumnKey,
  isRelationshipTypeColumnKey,
} from './contactEmergencyTabMigration.js';
import { getPrimaryPhone, hasWhatsApp } from './utils.js';

export interface ContactExportColumn {
  id: string;
  label: string;
}

export interface ContactExportLabels {
  yes: string;
  no: string;
}

/**
 * Sanitizer snapshot for a tenant, falling back to the default seed when the tenant has no
 * stored field config. Returning `null` there (the previous behaviour) silently disabled
 * viewer sanitization for exactly the tenants whose restrictions were unknown.
 */
export function resolveContactFieldConfigSnapshot(
  fieldConfig: FieldConfig | null | undefined,
): { fields: Record<string, FieldDefinition[]>; tabs: TabDefinition[] } {
  if (fieldConfig?.fields) {
    return { fields: fieldConfig.fields, tabs: fieldConfig.formTabs ?? [] };
  }
  return { fields: INITIAL_FIELD_SEED, tabs: DEFAULT_FORM_TABS };
}

function buildColumnFieldContext(
  fieldConfig: FieldConfig,
  viewerRole: string,
): ContactColumnFieldContext {
  const enabledTabIds = resolveContactEnabledTabIds(fieldConfig, viewerRole);
  const formTabs = fieldConfig.formTabs ?? [];
  const tabMap = new Map<string, (typeof formTabs)[number]>();
  for (const t of formTabs) {
    if (t.key) tabMap.set(t.key.toLowerCase(), t);
  }

  const fieldEnabledMap = new Map<string, boolean>();
  for (const [tabId, tabFields] of Object.entries(fieldConfig.fields ?? {})) {
    for (const f of tabFields) {
      if (f.key) {
        fieldEnabledMap.set(`${tabId.toLowerCase()}:${f.key}`, f.enabled !== false);
      }
    }
  }

  const tabAllows = (tabId: string): boolean => {
    if (isContactLockedEnabledTab(tabId)) return true;
    if (formTabs.length === 0) return true;
    const tab = tabMap.get(tabId.toLowerCase());
    if (!tab) return true;
    return tab.enabled !== false && canViewContactTab(viewerRole, tab);
  };

  return {
    fields: fieldConfig.fields,
    enabledTabIds,
    isTabFieldEnabled: (tabId, fieldId) => {
      if (!tabAllows(tabId)) return false;
      return fieldEnabledMap.get(`${tabId.toLowerCase()}:${fieldId}`) ?? true;
    },
  };
}

export const DEFAULT_CONTACT_EXPORT_COLUMNS: readonly ContactExportColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'gender', label: 'Gender' },
  { id: 'city', label: 'City' },
] as const;

/** Registry column ids the Work directory can render (SSOT: column registry + field mapping). */
const KNOWN_EXPORT_COLUMN_IDS: ReadonlySet<string> = new Set<string>([
  ...DEFAULT_COLUMN_REGISTRY.map((column) => column.key),
  ...Object.keys(COLUMN_FIELD_MAPPING),
]);

/**
 * Fail-closed gate for a client-requested export column.
 *
 * `canViewContactColumn` returns `true` for any key it cannot resolve to a field — right for
 * internally generated Work columns, wrong for the export endpoint, where the column list
 * arrives in the request body: an unresolvable key would fall through to
 * `compileContactColumnExtractor`'s raw-property stringify and disclose unconfigured fields.
 *
 * A column is exportable only when it is either
 * 1. a known registry column whose governing tab/field is enabled for the viewer, or
 * 2. a key that resolves to a configured field the viewer may read (custom fields).
 */
export function isExportableContactColumn(
  viewerRole: string,
  columnKey: string,
  columnFieldContext: ContactColumnFieldContext | null,
): boolean {
  const mapping = COLUMN_FIELD_MAPPING[columnKey];
  const knownColumn = mapping != null || KNOWN_EXPORT_COLUMN_IDS.has(columnKey);
  if (!columnFieldContext) return knownColumn;
  if (!canViewContactColumn(viewerRole, columnKey, columnFieldContext)) return false;
  if (knownColumn) {
    if (!mapping) return true;
    return (
      columnFieldContext.enabledTabIds.has(mapping.tabId) &&
      columnFieldContext.isTabFieldEnabled(mapping.tabId, mapping.fieldId)
    );
  }
  return resolveContactColumnField(columnKey, columnFieldContext) != null;
}

/** Filters export columns by the same field/tab visibility rules as Work columns. */
export function filterContactExportColumnsForViewer(
  columns: ContactExportColumn[],
  fieldConfig: FieldConfig | null | undefined,
  viewerRole: string,
): ContactExportColumn[] {
  const source = columns.length > 0 ? columns : [...DEFAULT_CONTACT_EXPORT_COLUMNS];
  const columnFieldContext = fieldConfig?.fields
    ? buildColumnFieldContext(fieldConfig, viewerRole)
    : null;
  return source.filter((column) =>
    isExportableContactColumn(viewerRole, column.id, columnFieldContext),
  );
}

function compileContactColumnExtractor(
  columnId: string,
  labels: ContactExportLabels,
): (contact: Contact) => string {
  if (columnId === 'name') return (c) => c.name || '';
  if (columnId === 'phone') return (c) => getPrimaryPhone(c) || '';
  if (columnId === 'email') return (c) => (c.emails || [])[0]?.address || '';
  if (columnId === 'whatsapp') return (c) => (hasWhatsApp(c) ? labels.yes : labels.no);
  if (columnId === 'isSyed') return (c) => (c.isSyed ? labels.yes : labels.no);
  if (columnId === 'line1') return (c) => (c.addresses || [])[0]?.line1 || '';
  if (columnId === 'city') return (c) => (c.addresses || [])[0]?.city || '';
  if (columnId === 'state') return (c) => (c.addresses || [])[0]?.state || '';
  if (columnId === 'country') return (c) => (c.addresses || [])[0]?.country || '';
  if (columnId === 'socials_platform') {
    return (c) => (c.socials || []).map((s) => s.platform).filter(Boolean).join('; ');
  }
  if (columnId === 'socials_url') {
    return (c) => (c.socials || []).map((s) => s.url).filter(Boolean).join('; ');
  }
  if (isRelationshipContactColumnKey(columnId)) {
    return (c) =>
      (c.relationshipContacts || [])
        .map((ec) => ec.name || (ec.contactId ? String(ec.contactId) : ''))
        .filter(Boolean)
        .join('; ');
  }
  if (isRelationshipTypeColumnKey(columnId)) {
    return (c) =>
      (c.relationshipContacts || [])
        .map((ec) => ec.relationship)
        .filter(Boolean)
        .join('; ');
  }
  return (c) => {
    const cellVal = c[columnId as keyof Contact];
    if (cellVal === undefined || cellVal === null) return '';
    return String(cellVal);
  };
}

/** Builds CSV rows (header + data) for the given contacts and visible columns. */
export function buildContactsExportRows(
  contacts: Contact[],
  columns: ContactExportColumn[],
  labels: ContactExportLabels,
): unknown[][] {
  const header = columns.map((column) => column.label);
  const extractors = columns.map(({ id }) => compileContactColumnExtractor(id, labels));
  const rows = contacts.map((contact) =>
    extractors.map((extract) => extract(contact)),
  );
  return [header, ...rows];
}
