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

export const ALL_CONTACT_FORM_EXPORT_COLUMNS: readonly ContactExportColumn[] = [
  // Tab 1: Identity / Basic
  { id: 'firstName', label: 'First Name' },
  { id: 'lastName', label: 'Last Name' },
  { id: 'gender', label: 'Gender' },
  { id: 'dob', label: 'Date of Birth' },
  { id: 'cnic', label: 'CNIC / National ID' },
  { id: 'isSyed', label: 'Is Syed' },
  { id: 'tag', label: 'Tag' },
  { id: 'notes', label: 'Notes' },

  // Tab 2: Phones
  { id: 'phone_label', label: 'Phone Type' },
  { id: 'phone_number', label: 'Phone Number' },

  // Tab 3: Emails
  { id: 'email_label', label: 'Email Type' },
  { id: 'email_address', label: 'Email Address' },

  // Tab 4: Addresses
  { id: 'address_label', label: 'Address Type' },
  { id: 'line1', label: 'Street Address' },
  { id: 'city', label: 'City' },
  { id: 'state', label: 'State / Province' },
  { id: 'country', label: 'Country' },

  // Tab 5: Socials
  { id: 'socials_platform', label: 'Social Platform' },
  { id: 'socials_url', label: 'Social URL' },

  // Tab 6: Education
  { id: 'education_degree', label: 'Degree / Qualification' },
  { id: 'education_institution', label: 'Institution' },
  { id: 'education_fieldOfStudy', label: 'Field of Study' },
  { id: 'education_year', label: 'Graduation Year' },
  { id: 'education_grade', label: 'Grade / Score' },

  // Tab 7: Experience
  { id: 'experience_title', label: 'Job Title' },
  { id: 'experience_organization', label: 'Organization' },
  { id: 'experience_employmentType', label: 'Employment Type' },
  { id: 'experience_location', label: 'Job Location' },
  { id: 'experience_startDate', label: 'Job Start Date' },
  { id: 'experience_endDate', label: 'Job End Date' },
  { id: 'experience_isCurrent', label: 'Currently Working Here' },
  { id: 'experience_description', label: 'Job Description' },

  // Tab 8: Skills
  { id: 'skills_name', label: 'Skill Name' },
  { id: 'skills_category', label: 'Skill Category' },
  { id: 'skills_proficiency', label: 'Skill Proficiency' },
  { id: 'skills_yearsOfExperience', label: 'Years of Experience' },
  { id: 'skills_isCertified', label: 'Certified' },
  { id: 'skills_issuer', label: 'Certifying Body / Issuer' },
  { id: 'skills_description', label: 'Skill Notes' },

  // Tab 9: Relationship
  { id: 'relationship_contact', label: 'Relationship Contact' },
  { id: 'relationship_type', label: 'Relationship Type' },

  // Tab 10: Bank Details
  { id: 'bank_name', label: 'Bank Name' },
  { id: 'bank_accountTitle', label: 'Bank Account Title' },
  { id: 'bank_accountNumber', label: 'Bank Account Number' },
] as const;

export const DEFAULT_CONTACT_EXPORT_COLUMNS: readonly ContactExportColumn[] = ALL_CONTACT_FORM_EXPORT_COLUMNS;

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
  const joinItems = <T>(items: T[] | undefined, fn: (item: T) => string) =>
    (items || []).map(fn).filter(Boolean).join('; ');

  if (columnId === 'name') return (c) => c.name || '';
  if (columnId === 'firstName') return (c) => c.firstName || '';
  if (columnId === 'lastName') return (c) => c.lastName || '';
  if (columnId === 'gender') return (c) => c.gender || '';
  if (columnId === 'dob') return (c) => c.dob || '';
  if (columnId === 'cnic') return (c) => c.cnic || '';
  if (columnId === 'tag') return (c) => c.tag || (Array.isArray(c.tags) ? c.tags.join('; ') : '');
  if (columnId === 'notes') return (c) => c.notes || '';
  if (columnId === 'isSyed') return (c) => (c.isSyed ? labels.yes : labels.no);
  if (columnId === 'phone') return (c) => getPrimaryPhone(c) || '';
  if (columnId === 'phone_number') {
    return (c) => (c.phones && c.phones.length > 0)
      ? joinItems(c.phones, (p) => p.number)
      : (getPrimaryPhone(c) || '');
  }
  if (columnId === 'phone_label') return (c) => joinItems(c.phones, (p) => p.label || 'Mobile');
  if (columnId === 'email') return (c) => (c.emails || [])[0]?.address || c.email || '';
  if (columnId === 'email_address') {
    return (c) => (c.emails && c.emails.length > 0)
      ? joinItems(c.emails, (e) => e.address)
      : (c.email || '');
  }
  if (columnId === 'email_label') return (c) => joinItems(c.emails, (e) => e.label || 'Personal');
  if (columnId === 'whatsapp') return (c) => (hasWhatsApp(c) ? labels.yes : labels.no);
  if (columnId === 'address_label') return (c) => joinItems(c.addresses, (a) => a.label || 'Home');
  if (columnId === 'line1') return (c) => joinItems(c.addresses, (a) => a.line1 || '') || c.line1 || c.address || '';
  if (columnId === 'city') return (c) => joinItems(c.addresses, (a) => a.city || '') || c.city || '';
  if (columnId === 'state') return (c) => joinItems(c.addresses, (a) => a.state || '') || c.state || '';
  if (columnId === 'country') return (c) => joinItems(c.addresses, (a) => a.country || '') || c.country || '';
  if (columnId === 'socials_platform') return (c) => joinItems(c.socials, (s) => s.platform);
  if (columnId === 'socials_url') return (c) => joinItems(c.socials, (s) => s.url);
  if (columnId === 'education_degree') return (c) => joinItems(c.education, (e) => e.degree || '');
  if (columnId === 'education_institution') return (c) => joinItems(c.education, (e) => e.institution || '');
  if (columnId === 'education_fieldOfStudy') return (c) => joinItems(c.education, (e) => e.fieldOfStudy || '');
  if (columnId === 'education_year') return (c) => joinItems(c.education, (e) => e.year || '');
  if (columnId === 'education_grade') return (c) => joinItems(c.education, (e) => e.grade || '');
  if (columnId === 'experience_title') return (c) => joinItems(c.experience, (e) => e.title || '');
  if (columnId === 'experience_organization') return (c) => joinItems(c.experience, (e) => e.organization || '');
  if (columnId === 'experience_employmentType') return (c) => joinItems(c.experience, (e) => e.employmentType || '');
  if (columnId === 'experience_location') return (c) => joinItems(c.experience, (e) => e.location || '');
  if (columnId === 'experience_startDate') return (c) => joinItems(c.experience, (e) => e.startDate || '');
  if (columnId === 'experience_endDate') return (c) => joinItems(c.experience, (e) => e.endDate || '');
  if (columnId === 'experience_isCurrent') return (c) => joinItems(c.experience, (e) => (e.isCurrent ? labels.yes : labels.no));
  if (columnId === 'experience_description') return (c) => joinItems(c.experience, (e) => e.description || '');
  if (columnId === 'skills_name' || columnId === 'skills') return (c) => joinItems(c.skills, (s) => s.name || '');
  if (columnId === 'skills_category') return (c) => joinItems(c.skills, (s) => s.category || '');
  if (columnId === 'skills_proficiency') return (c) => joinItems(c.skills, (s) => s.proficiency || '');
  if (columnId === 'skills_yearsOfExperience') return (c) => joinItems(c.skills, (s) => s.yearsOfExperience || '');
  if (columnId === 'skills_isCertified') return (c) => joinItems(c.skills, (s) => (s.isCertified ? labels.yes : labels.no));
  if (columnId === 'skills_issuer') return (c) => joinItems(c.skills, (s) => s.issuer || '');
  if (columnId === 'skills_description') return (c) => joinItems(c.skills, (s) => s.description || '');
  if (isRelationshipContactColumnKey(columnId)) {
    return (c) => joinItems(c.relationshipContacts, (ec) => ec.name || (ec.contactId ? String(ec.contactId) : ''));
  }
  if (isRelationshipTypeColumnKey(columnId)) {
    return (c) => joinItems(c.relationshipContacts, (ec) => ec.relationship || '');
  }
  if (columnId === 'bank_name') return (c) => joinItems(c.bankDetails, (b) => b.bankName || '');
  if (columnId === 'bank_accountTitle') return (c) => joinItems(c.bankDetails, (b) => b.accountTitle || '');
  if (columnId === 'bank_accountNumber' || columnId === 'bank_account') {
    return (c) => joinItems(c.bankDetails, (b) => b.accountNumber || '');
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
