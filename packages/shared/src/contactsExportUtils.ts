import type { Contact, FieldDefinition, FieldConfig } from './contactTypes.js';
import { canViewContactColumn, type ContactColumnFieldContext } from './contactColumnAccess.js';
import { canViewContactTab } from './contactFieldAccess.js';
import { getPrimaryPhone, hasWhatsApp } from './utils.js';

export interface ContactExportColumn {
  id: string;
  label: string;
}

export interface ContactExportLabels {
  yes: string;
  no: string;
}

function tabAllowsField(
  viewerRole: string,
  fieldConfig: FieldConfig,
  tabId: string,
): boolean {
  if (tabId === 'basic') return true;
  const formTabs = fieldConfig.formTabs ?? [];
  if (formTabs.length === 0) return true;
  const tab = formTabs.find((candidate) => candidate.key === tabId);
  if (!tab) return true;
  return tab.enabled !== false && canViewContactTab(viewerRole, tab);
}

function visibleTabIds(fieldConfig: FieldConfig, viewerRole: string): Set<string> {
  const formTabs = fieldConfig.formTabs ?? [];
  if (formTabs.length === 0) {
    return new Set(Object.keys(fieldConfig.fields).filter((tabId) => tabId !== 'basic'));
  }
  return new Set(
    formTabs
      .filter((tab) => tab.enabled !== false && canViewContactTab(viewerRole, tab))
      .map((tab) => tab.key),
  );
}

function buildColumnFieldContext(
  fieldConfig: FieldConfig,
  viewerRole: string,
): ContactColumnFieldContext {
  const enabledTabIds = visibleTabIds(fieldConfig, viewerRole);
  return {
    fields: fieldConfig.fields,
    enabledTabIds,
    isTabFieldEnabled: (tabId, fieldId) => {
      if (!tabAllowsField(viewerRole, fieldConfig, tabId)) return false;
      const field = (fieldConfig.fields[tabId] ?? []).find((candidate: FieldDefinition) => candidate.key === fieldId);
      return field?.enabled !== false;
    },
  };
}

/** Filters export columns by the same field/tab visibility rules as Work columns. */
export function filterContactExportColumnsForViewer(
  columns: ContactExportColumn[],
  fieldConfig: FieldConfig | null | undefined,
  viewerRole: string,
): ContactExportColumn[] {
  if (!fieldConfig?.fields) return columns;
  const columnFieldContext = buildColumnFieldContext(fieldConfig, viewerRole);
  return columns.filter((column) => canViewContactColumn(viewerRole, column.id, columnFieldContext));
}

function cellValue(
  contact: Contact,
  columnId: string,
  labels: ContactExportLabels,
): string {
  if (columnId === 'name') return contact.name || '';
  if (columnId === 'phone') return getPrimaryPhone(contact) || '';
  if (columnId === 'email') {
    return (contact.emails || [])[0]?.address || (contact.email as string) || '';
  }
  if (columnId === 'whatsapp') return hasWhatsApp(contact) ? labels.yes : labels.no;
  if (columnId === 'city') {
    return (contact.addresses || [])[0]?.city || (contact.city as string) || '';
  }
  if (columnId === 'state') {
    return (contact.addresses || [])[0]?.state || (contact.state as string) || '';
  }
  if (columnId === 'country') {
    return (contact.addresses || [])[0]?.country || (contact.country as string) || '';
  }
  const cellValue = contact[columnId as keyof Contact];
  if (cellValue === undefined || cellValue === null) return '';
  return String(cellValue);
}

/** Builds CSV rows (header + data) for the given contacts and visible columns. */
export function buildContactsExportRows(
  contacts: Contact[],
  columns: ContactExportColumn[],
  labels: ContactExportLabels,
): unknown[][] {
  const header = columns.map((column) => column.label);
  const rows = contacts.map((contact) =>
    columns.map(({ id }) => cellValue(contact, id, labels)),
  );
  return [header, ...rows];
}
