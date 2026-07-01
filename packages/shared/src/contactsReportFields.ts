import type { Contact, FieldDefinition, TabDefinition } from './contactTypes.js';
import { INITIAL_FIELD_SEED } from './contactTypes.js';
import { canViewContactField, canViewContactTab } from './contactFieldAccess.js';
import { getPrimaryPhone } from './utils.js';

export const CONTACTS_REPORT_FIELD_IDS = [
  'fullName',
  'firstName',
  'lastName',
  'gender',
  'dob',
  'isSyed',
  'phone',
  'email',
  'streetAddress',
  'city',
  'state',
  'country',
  'emergencyContact',
  'lastActivity',
  'notesCount',
] as const;

export type ContactsReportFieldId = (typeof CONTACTS_REPORT_FIELD_IDS)[number] | string;

export interface ContactsReportFieldDef {
  id: ContactsReportFieldId;
  labelKey: string;
}

export const CONTACTS_REPORT_FIELDS: ContactsReportFieldDef[] = [
  { id: 'fullName', labelKey: 'contacts.reportFields.fullName' },
  { id: 'firstName', labelKey: 'contacts.reportFields.firstName' },
  { id: 'lastName', labelKey: 'contacts.reportFields.lastName' },
  { id: 'gender', labelKey: 'contacts.reportFields.gender' },
  { id: 'dob', labelKey: 'contacts.reportFields.dob' },
  { id: 'isSyed', labelKey: 'contacts.reportFields.isSyed' },
  { id: 'phone', labelKey: 'contacts.reportFields.phone' },
  { id: 'email', labelKey: 'contacts.reportFields.email' },
  { id: 'streetAddress', labelKey: 'contacts.reportFields.streetAddress' },
  { id: 'city', labelKey: 'contacts.reportFields.city' },
  { id: 'state', labelKey: 'contacts.reportFields.state' },
  { id: 'country', labelKey: 'contacts.reportFields.country' },
  { id: 'emergencyContact', labelKey: 'contacts.reportFields.emergencyContact' },
  { id: 'lastActivity', labelKey: 'contacts.reportFields.lastActivity' },
  { id: 'notesCount', labelKey: 'contacts.reportFields.notesCount' },
];

const REPORT_FIELD_ID_SET = new Set<string>(CONTACTS_REPORT_FIELD_IDS);

export const CUSTOM_CONTACT_REPORT_FIELD_PREFIX = 'custom:';

const PREDEFINED_FIELD_KEYS = new Set(
  Object.values(INITIAL_FIELD_SEED).flatMap((fields) => fields.map((f) => f.key)),
);

export function isContactsReportFieldId(value: string): value is ContactsReportFieldId {
  return REPORT_FIELD_ID_SET.has(value) || isCustomContactReportFieldId(value);
}

export function isCustomContactReportFieldId(value: string): boolean {
  return value.startsWith(CUSTOM_CONTACT_REPORT_FIELD_PREFIX);
}

export function customContactReportFieldKey(fieldId: string): string {
  return fieldId.slice(CUSTOM_CONTACT_REPORT_FIELD_PREFIX.length);
}

/** Merges registry custom fields into the contacts report builder catalog (§4.1). */
export function buildContactsReportFieldCatalog(
  fields: Record<string, FieldDefinition[]>,
  tabs: TabDefinition[],
  viewerRole: string,
): ContactsReportFieldDef[] {
  const builtInIds = new Set(CONTACTS_REPORT_FIELDS.map((f) => f.id));
  const custom: ContactsReportFieldDef[] = [];

  for (const tab of tabs) {
    if (!tab.enabled || !canViewContactTab(viewerRole, tab)) continue;
    const tabFields = fields[tab.key] ?? [];
    for (const field of tabFields) {
      if (!field.enabled || !canViewContactField(viewerRole, field)) continue;
      if (PREDEFINED_FIELD_KEYS.has(field.key) && builtInIds.has(field.key)) continue;
      if (PREDEFINED_FIELD_KEYS.has(field.key)) continue;
      const id = `${CUSTOM_CONTACT_REPORT_FIELD_PREFIX}${field.key}`;
      if (custom.some((c) => c.id === id)) continue;
      custom.push({ id, labelKey: `contacts.reportFields.custom.${field.key}` });
    }
  }

  return [...CONTACTS_REPORT_FIELDS, ...custom];
}

export function resolveContactReportFieldLabel(
  fieldId: string,
  fields: Record<string, FieldDefinition[]>,
  t: (key: string) => string,
): string {
  if (REPORT_FIELD_ID_SET.has(fieldId)) {
    const def = CONTACTS_REPORT_FIELDS.find((d) => d.id === fieldId);
    return def ? t(def.labelKey) : fieldId;
  }
  if (isCustomContactReportFieldId(fieldId)) {
    const key = customContactReportFieldKey(fieldId);
    for (const tabFields of Object.values(fields)) {
      const match = tabFields.find((f) => f.key === key);
      if (match) return match.label;
    }
    return key;
  }
  return fieldId;
}

export interface ContactReportCellLabels {
  yes: string;
  no: string;
}

/** Resolves a contact report cell for CustomReportBuilder preview/export. */
export function getContactReportCellValue(
  item: Record<string, unknown>,
  fieldId: string,
  labels: ContactReportCellLabels,
): string | number {
  const contact = item as Contact;
  if (isCustomContactReportFieldId(fieldId)) {
    const key = customContactReportFieldKey(fieldId);
    const value = contact[key];
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'boolean') return value ? labels.yes : labels.no;
    return String(value);
  }

  switch (fieldId) {
    case 'fullName':
      return String(contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`).trim() || '—';
    case 'firstName':
      return String(contact.firstName || '—');
    case 'lastName':
      return String(contact.lastName || '—');
    case 'isSyed':
      return contact.isSyed ? labels.yes : labels.no;

    case 'phone': {
      const phones = contact.phones;
      return getPrimaryPhone(contact) || (phones?.[0]?.number ?? String(contact.phone || '—'));
    }
    case 'email': {
      const emails = contact.emails;
      return emails?.[0]?.address || String(contact.email || '—');
    }
    case 'streetAddress': {
      const addresses = contact.addresses;
      return addresses?.[0]?.line1 || '—';
    }
    case 'city':
      return contact.addresses?.[0]?.city || String(contact.city || '—');
    case 'state':
      return contact.addresses?.[0]?.state || String(contact.state || '—');
    case 'country':
      return contact.addresses?.[0]?.country || String(contact.country || '—');
    case 'emergencyContact': {
      const emergencies = contact.emergencyContacts;
      return emergencies?.[0]?.name || '—';
    }
    case 'lastActivity': {
      const activities = contact.activities;
      return activities?.[0]?.date || '—';
    }
    case 'notesCount': {
      const noteActivities = contact.activities?.filter((a) => a.type === 'note') ?? [];
      return noteActivities.length;
    }
    default: {
      const value = contact[fieldId as keyof Contact];
      if (value === undefined || value === null) return '—';
      return String(value);
    }
  }
}
