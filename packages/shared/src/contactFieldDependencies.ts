import { INITIAL_FIELD_SEED, type ColumnRegistryEntry, type Contact, type ContactPreferences } from './contactTypes.js';

export type ContactFieldDependencyArea = 'systemField' | 'column' | 'duplicateDetection' | 'contactData';

export interface ContactFieldDependencyIssue {
  area: ContactFieldDependencyArea;
  /** i18n key — FE passes to t() with optional { count }. */
  messageKey: string;
  count?: number;
}

const SEED_FIELD_KEYS = new Set(
  Object.values(INITIAL_FIELD_SEED).flatMap((fields) => fields.map((f) => f.key)),
);

export function isContactSeedFieldKey(fieldKey: string): boolean {
  return SEED_FIELD_KEYS.has(fieldKey);
}

export interface ContactFieldDependencyInput {
  fieldKey: string;
  columnRegistry: ColumnRegistryEntry[];
  prefs: Pick<ContactPreferences, 'duplicateDetectionFields'>;
  contacts?: Contact[];
}

/**
 * Returns blocking issues before removing a field from Contacts Setup (globle1 §6.6).
 */
export function getContactFieldRemovalIssues(
  input: ContactFieldDependencyInput,
): ContactFieldDependencyIssue[] {
  const { fieldKey, columnRegistry, prefs, contacts = [] } = input;
  const issues: ContactFieldDependencyIssue[] = [];

  if (isContactSeedFieldKey(fieldKey)) {
    issues.push({
      area: 'systemField',
      messageKey: 'contacts.setup.cannotDeleteSystemField',
    });
    return issues;
  }

  const column = columnRegistry.find((c) => c.key === fieldKey && c.enabled);
  if (column) {
    issues.push({
      area: 'column',
      messageKey: 'contacts.setup.fieldUsedInColumn',
    });
  }

  if (prefs.duplicateDetectionFields?.includes(fieldKey)) {
    issues.push({
      area: 'duplicateDetection',
      messageKey: 'contacts.setup.fieldUsedInDuplicateDetection',
    });
  }

  const dataCount = contacts.filter((contact) => {
    const val = contact[fieldKey as keyof Contact];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }).length;

  if (dataCount > 0) {
    issues.push({
      area: 'contactData',
      messageKey: 'contacts.setup.fieldHasContactData',
      count: dataCount,
    });
  }

  return issues;
}

/** Count active contacts with a non-empty value for a custom field key. */
export function countContactsWithFieldValue(contacts: Contact[], fieldKey: string): number {
  return contacts.filter((contact) => {
    const val = contact[fieldKey as keyof Contact];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  }).length;
}
