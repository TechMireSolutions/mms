import {
  applyTitleCaseToContact,
  computeContactsCommandMetrics,
  computeContactsMonthlyCreatedCounts,
  computeContactsReportAnalytics,
  computeContactsWidgetAggregates,
  countContactsWithFieldValue,
  DEFAULT_ENABLED_TABS,
  DEFAULT_FORM_TABS,
  DEFAULT_REQUIRED_TABS,
  filterActiveContacts,
  normalizeToE164,
  paginateContacts,
  parsePhoneNumber,
  type Contact,
  type ContactsCommandMetricsSnapshot,
  type ContactsDuplicatePairsPageResult,
  type ContactsListQuery,
  type ContactsListPageResult,
  type ContactsMonthlyYearCounts,
  type ContactsReportAnalyticsSnapshot,
  type ContactsWidgetAggregateResult,
  type ContactsWidgetQuery,
  type FieldConfig,
} from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';
import { loadContactFieldConfig } from './contactConfigService.js';
import { invalidateDuplicateScanCache } from './contactDuplicateScanService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listContactsByWorkspace,
  findContactById,
  saveContact,
  findContactsByIds,
  bulkSaveContacts,
} from '../db/repositories/contactRepository.js';

export interface ContactRuntimeDefaults {
  defaultPhoneCountryCode: string;
  phoneLabel: string;
  emailLabel: string;
}

export async function loadContacts(options?: { includeDeleted?: boolean }): Promise<Contact[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const contactsList = await listContactsByWorkspace(tenant);
  return options?.includeDeleted ? contactsList : filterActiveContacts(contactsList);
}

export async function loadContactsPage(query: ContactsListQuery): Promise<ContactsListPageResult> {
  const all = await loadContacts({ includeDeleted: query.includeDeleted });
  return paginateContacts(all, query);
}

function metricsFieldConfig(fieldConfig: FieldConfig | null): FieldConfig {
  if (fieldConfig?.fields && fieldConfig.formTabs) return fieldConfig;
  return {
    version: 1,
    enabledTabs: [...DEFAULT_ENABLED_TABS],
    requiredTabs: [...DEFAULT_REQUIRED_TABS],
    fields: {},
    formTabs: DEFAULT_FORM_TABS,
  };
}

export async function loadContactsCommandMetrics(): Promise<ContactsCommandMetricsSnapshot> {
  const contacts = await loadContacts();
  const fieldConfig = metricsFieldConfig(await loadContactFieldConfig());
  return computeContactsCommandMetrics(contacts, { fieldConfig });
}

function firstString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function firstCollectionString(rows: unknown[] | null): string {
  return firstString(rows?.[0]);
}

function firstCountryCode(rows: unknown[] | null): string {
  const first = rows?.find((entry) => {
    return entry && typeof entry === 'object' && typeof (entry as { code?: unknown }).code === 'string';
  }) as { code?: string } | undefined;
  return first?.code ?? '';
}

export async function loadContactRuntimeDefaults(): Promise<ContactRuntimeDefaults> {
  const [countryCodes, phoneLabels, emailLabels] = await Promise.all([
    fetchCollection('countryCodes'),
    fetchCollection('phoneLabels'),
    fetchCollection('emailLabels'),
  ]);

  return {
    defaultPhoneCountryCode: firstCountryCode(countryCodes),
    phoneLabel: firstCollectionString(phoneLabels),
    emailLabel: firstCollectionString(emailLabels),
  };
}

export async function loadContactsReportAnalytics(options?: {
  compareYears?: number[];
}): Promise<{ analytics: ContactsReportAnalyticsSnapshot; monthlyByYear?: ContactsMonthlyYearCounts[] }> {
  const contacts = await loadContacts();
  const analytics = computeContactsReportAnalytics(contacts);

  const years = options?.compareYears?.filter(Boolean) ?? [];
  if (years.length === 0) {
    return { analytics };
  }

  const monthlyByYear = years.map((year) => ({
    year,
    months: computeContactsMonthlyCreatedCounts(contacts, year),
  }));

  return { analytics, monthlyByYear };
}

export async function loadContactFieldUsageCount(fieldKey: string): Promise<number> {
  const contacts = await loadContacts();
  return countContactsWithFieldValue(contacts, fieldKey);
}

export async function loadContactsWidgetAggregates(
  queries: ContactsWidgetQuery[],
): Promise<Record<string, ContactsWidgetAggregateResult>> {
  const contacts = await loadContacts();
  return computeContactsWidgetAggregates(contacts, queries);
}

export async function loadContactsByIds(ids: string[]): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const wanted = new Set(ids.map(String));
  const all = await loadContacts();
  return all.filter((contact) => wanted.has(String(contact.id)));
}

export async function loadContactDuplicatePairsPage(query: {
  page?: number;
  limit?: number;
}): Promise<ContactsDuplicatePairsPageResult> {
  const { loadDuplicatePairsPage } = await import('./contactDuplicateScanService.js');
  return loadDuplicatePairsPage(query);
}

export async function getContactById(id: string, includeDeleted = false): Promise<Contact | null> {
  const all = await loadContacts({ includeDeleted: true });
  const found = all.find((contact) => String(contact.id) === id);
  if (!found) return null;
  if (!includeDeleted && found.deletedAt) return null;
  return found;
}

export async function normalizeContactPhones(contact: Contact): Promise<Contact> {
  if (!contact.phones?.length) {
    return contact;
  }
  const { defaultPhoneCountryCode } = await loadContactRuntimeDefaults();
  const countryCodes = (await fetchCollection('countryCodes')) || [];
  const knownCodes = countryCodes
    .map((row) => (row && typeof row === 'object' && typeof (row as { code?: unknown }).code === 'string' ? (row as { code: string }).code : ''))
    .filter(Boolean);

  return {
    ...contact,
    phones: contact.phones.map((phone) => {
      const fallbackCode = phone.countryCode || defaultPhoneCountryCode;
      const trimmedNumber = (phone.number || "").trim();
      let parsed;
      if (trimmedNumber.startsWith("+") || trimmedNumber.startsWith("00")) {
        parsed = parsePhoneNumber(trimmedNumber, fallbackCode, knownCodes);
      } else {
        const e164 = normalizeToE164(fallbackCode, phone.number);
        parsed = parsePhoneNumber(e164, fallbackCode, knownCodes);
      }
      return {
        ...phone,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    }),
  };
}

export async function prepareContactRecord(contact: Contact, id?: string | number): Promise<Contact> {
  const withPhones = await normalizeContactPhones(contact);
  const resolvedId = id ?? withPhones.id ?? `temp-${Date.now()}`;
  return applyTitleCaseToContact({ ...withPhones, id: resolvedId }) as Contact;
}

const SOURCE_AS_CHILD_TERMS = new Set(['father', 'mother', 'parent']);
const SOURCE_AS_PARENT_TERMS = new Set(['son', 'daughter', 'child']);
const SOURCE_AS_SIBLING_TERMS = new Set(['brother', 'sister', 'sibling']);
const SPOUSE_TERMS = new Set(['spouse', 'husband', 'wife']);
const SOURCE_AS_GUARDIAN_TERMS = new Set(['guardian']);
const SOURCE_AS_DEPENDENT_TERMS = new Set(['dependent', 'ward']);

function normalizeRelationshipTerm(relationship: unknown): string {
  return typeof relationship === 'string' ? relationship.trim().toLowerCase() : '';
}

function genderedRelationship(contact: Contact, maleTerm: string, femaleTerm: string): string {
  const gender = typeof contact.gender === 'string' ? contact.gender.trim().toLowerCase() : '';
  return gender === 'female' || gender === 'f' || gender === 'woman' || gender === 'girl'
    ? femaleTerm
    : maleTerm;
}

function reciprocalEmergencyRelationship(sourceContact: Contact, assignedRelationship: unknown): string {
  const relationship = normalizeRelationshipTerm(assignedRelationship);
  if (SOURCE_AS_CHILD_TERMS.has(relationship)) return genderedRelationship(sourceContact, 'Son', 'Daughter');
  if (SOURCE_AS_PARENT_TERMS.has(relationship)) return genderedRelationship(sourceContact, 'Father', 'Mother');
  if (SOURCE_AS_SIBLING_TERMS.has(relationship)) return genderedRelationship(sourceContact, 'Brother', 'Sister');
  if (SPOUSE_TERMS.has(relationship)) return 'Spouse';
  if (SOURCE_AS_GUARDIAN_TERMS.has(relationship)) return 'Dependent';
  if (SOURCE_AS_DEPENDENT_TERMS.has(relationship)) return 'Guardian';
  return 'Other';
}

async function applyEmergencyReciprocalLinks(tenant: string, sourceContact: Contact): Promise<void> {
  const sourceId = String(sourceContact.id);
  const emergencyContacts = sourceContact.emergencyContacts ?? [];
  const linkedIds = Array.from(
    new Set(
      emergencyContacts
        .map((entry) => entry.contactId)
        .filter((contactId) => contactId != null && String(contactId).trim() && String(contactId) !== sourceId)
        .map(String),
    ),
  );
  if (linkedIds.length === 0) return;

  const linkedContacts = await findContactsByIds(tenant, linkedIds);
  const linkedById = new Map(linkedContacts.map((contact) => [String(contact.id), contact]));
  const updatesById = new Map<string, Contact>();

  for (const emergencyContact of emergencyContacts) {
    const linkedId = emergencyContact.contactId == null ? '' : String(emergencyContact.contactId);
    if (!linkedId || linkedId === sourceId) continue;

    const linkedContact = updatesById.get(linkedId) ?? linkedById.get(linkedId);
    if (!linkedContact || linkedContact.deletedAt) continue;

    const inverseRelationship = reciprocalEmergencyRelationship(sourceContact, emergencyContact.relationship);
    const existingEmergencyContacts = linkedContact.emergencyContacts ?? [];
    const existingIndex = existingEmergencyContacts.findIndex((entry) => String(entry.contactId) === sourceId);
    const reciprocalEntry = {
      contactId: sourceId,
      relationship: inverseRelationship,
    };
    const nextEmergencyContacts =
      existingIndex >= 0
        ? existingEmergencyContacts.map((entry, index) =>
            index === existingIndex ? { ...entry, ...reciprocalEntry } : entry,
          )
        : [...existingEmergencyContacts, reciprocalEntry];

    updatesById.set(linkedId, {
      ...linkedContact,
      emergencyContacts: nextEmergencyContacts,
    });
  }

  const updates = Array.from(updatesById.values());
  if (updates.length > 0) {
    await bulkSaveContacts(tenant, updates);
  }
}

export async function upsertContact(contact: Contact): Promise<{
  contact: Contact;
  created: boolean;
  restoredFromDelete?: boolean;
}> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const contactWithId = await prepareContactRecord(contact, contact.id);
  const existing = await findContactById(tenant, String(contactWithId.id));
  const created = !existing;
  const restoredFromDelete = existing && Boolean(existing.deletedAt);

  let saved: Contact;
  if (created) {
    saved = contactWithId;
  } else {
    saved = { ...existing, ...contactWithId, deletedAt: undefined, deletedBy: undefined };
  }

  await saveContact(tenant, saved);
  await applyEmergencyReciprocalLinks(tenant, saved);
  await invalidateDuplicateScanCache();
  return { contact: saved, created, restoredFromDelete: restoredFromDelete || undefined };
}

export async function updateContactById(id: string, contact: Contact): Promise<Contact | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findContactById(tenant, id);
  if (!existing || existing.deletedAt) {
    return null;
  }
  const contactWithId = await prepareContactRecord({ ...contact, id }, id);
  await saveContact(tenant, contactWithId);
  await applyEmergencyReciprocalLinks(tenant, contactWithId);
  await invalidateDuplicateScanCache();
  return contactWithId;
}

export async function restoreContactById(id: string, _restoredBy: string): Promise<Contact | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findContactById(tenant, id);
  if (!existing) return null;
  if (!existing.deletedAt) return existing;

  const now = new Date().toISOString();
  const restored: Contact = {
    ...existing,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,
    updatedAt: now,
  };
  await saveContact(tenant, restored);
  await invalidateDuplicateScanCache();
  return restored;
}

export async function bulkRestoreContacts(
  ids: string[],
  _restoredBy: string,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };
  let succeeded = 0;
  let failed = 0;
  const now = new Date().toISOString();
  const toSave: Contact[] = [];

  const existingContacts = await findContactsByIds(tenant, ids);
  const existingMap = new Map(existingContacts.map((c) => [c.id, c]));

  for (const id of ids) {
    const existing = existingMap.get(id);
    if (existing && existing.deletedAt) {
      const restored: Contact = {
        ...existing,
        deletedAt: undefined,
        deletedBy: undefined,
        deletionReason: undefined,
        updatedAt: now,
      };
      toSave.push(restored);
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  if (toSave.length > 0) {
    await bulkSaveContacts(tenant, toSave);
    await invalidateDuplicateScanCache();
  }
  return { succeeded, failed };
}

export async function softDeleteContactById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findContactById(tenant, id);
  if (!existing || existing.deletedAt) {
    return false;
  }
  const trimmedReason = deletionReason?.trim();
  const updated: Contact = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: trimmedReason || undefined,
  };
  await saveContact(tenant, updated);
  await invalidateDuplicateScanCache();
  return true;
}

export async function bulkSoftDeleteContacts(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };
  let succeeded = 0;
  let failed = 0;
  const now = new Date().toISOString();
  const trimmedReason = deletionReason?.trim();
  const toSave: Contact[] = [];

  const existingContacts = await findContactsByIds(tenant, ids);
  const existingMap = new Map(existingContacts.map((c) => [c.id, c]));

  for (const id of ids) {
    const existing = existingMap.get(id);
    if (existing && !existing.deletedAt) {
      const updated: Contact = {
        ...existing,
        deletedAt: now,
        deletedBy,
        deletionReason: trimmedReason || undefined,
      };
      toSave.push(updated);
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  if (toSave.length > 0) {
    await bulkSaveContacts(tenant, toSave);
    await invalidateDuplicateScanCache();
  }
  return { succeeded, failed };
}
