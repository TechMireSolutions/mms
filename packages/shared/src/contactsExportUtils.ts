import type { Contact, FieldConfig } from './contactTypes.js';
import { canViewContactColumn, type ContactColumnFieldContext } from './contactColumnAccess.js';
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

/** Filters export columns by the same field/tab visibility rules as Work columns. */
export function filterContactExportColumnsForViewer(
  columns: ContactExportColumn[],
  fieldConfig: FieldConfig | null | undefined,
  viewerRole: string,
): ContactExportColumn[] {
  const source = columns.length > 0 ? columns : [...DEFAULT_CONTACT_EXPORT_COLUMNS];
  if (!fieldConfig?.fields) return source;
  const columnFieldContext = buildColumnFieldContext(fieldConfig, viewerRole);
  return source.filter((column) => canViewContactColumn(viewerRole, column.id, columnFieldContext));
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
