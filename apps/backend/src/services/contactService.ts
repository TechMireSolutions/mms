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
import { applyContactRelationshipInference } from './contactRelationshipInferenceService.js';
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
  await applyContactRelationshipInference(tenant, saved);
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
  await applyContactRelationshipInference(tenant, contactWithId);
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
