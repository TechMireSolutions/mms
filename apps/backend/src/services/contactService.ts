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
import { fetchCollection, persistCollection } from './dbSyncService.js';
import { contactListSchema } from '../validation/contactSchemas.js';
import { loadContactFieldConfig } from './contactConfigService.js';
import { invalidateDuplicateScanCache } from './contactDuplicateScanService.js';

export interface ContactRuntimeDefaults {
  defaultPhoneCountryCode: string;
  phoneLabel: string;
  emailLabel: string;
  lifecycleStage: string;
}

export async function loadContacts(options?: { includeDeleted?: boolean }): Promise<Contact[]> {
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  const all = parsed.success ? (parsed.data as Contact[]) : [];
  return options?.includeDeleted ? all : filterActiveContacts(all);
}

export async function loadContactsPage(query: ContactsListQuery): Promise<ContactsListPageResult> {
  const all = await loadContacts({ includeDeleted: query.includeDeleted });
  return paginateContacts(all, query);
}

function metricsFieldConfig(cfg: FieldConfig | null): FieldConfig {
  if (cfg?.fields && cfg.formTabs) return cfg;
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
  const cfg = metricsFieldConfig(await loadContactFieldConfig());
  return computeContactsCommandMetrics(contacts, { fieldConfig: cfg });
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

async function resolveDefaultLifecycleStage(cfg: FieldConfig): Promise<string> {
  const field = (cfg.fields?.basic ?? []).find((f) => f.key === 'lifecycleStage');
  return (
    field?.options?.[0]
    || firstCollectionString(await fetchCollection('lifecycleStages'))
    || ''
  );
}

export async function loadContactRuntimeDefaults(): Promise<ContactRuntimeDefaults> {
  const [countryCodes, phoneLabels, emailLabels, lifecycleStages] = await Promise.all([
    fetchCollection('countryCodes'),
    fetchCollection('phoneLabels'),
    fetchCollection('emailLabels'),
    fetchCollection('lifecycleStages'),
  ]);

  return {
    defaultPhoneCountryCode: firstCountryCode(countryCodes),
    phoneLabel: firstCollectionString(phoneLabels),
    emailLabel: firstCollectionString(emailLabels),
    lifecycleStage: firstCollectionString(lifecycleStages),
  };
}

export async function loadContactsReportAnalytics(options?: {
  compareYears?: number[];
}): Promise<{ analytics: ContactsReportAnalyticsSnapshot; monthlyByYear?: ContactsMonthlyYearCounts[] }> {
  const contacts = await loadContacts();
  const cfg = metricsFieldConfig(await loadContactFieldConfig());
  const defaultStage = await resolveDefaultLifecycleStage(cfg);
  const analytics = computeContactsReportAnalytics(contacts, { defaultStage });

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
  const found = all.find((c) => String(c.id) === id);
  if (!found) return null;
  if (!includeDeleted && found.deletedAt) return null;
  return found;
}

export async function normalizeContactPhones(contact: Contact): Promise<Contact> {
  if (!contact.phones?.length) {
    return contact;
  }
  const { defaultPhoneCountryCode } = await loadContactRuntimeDefaults();
  return {
    ...contact,
    phones: contact.phones.map((p) => {
      const fallbackCode = p.countryCode || defaultPhoneCountryCode;
      const e164 = normalizeToE164(fallbackCode, p.number);
      const parsed = parsePhoneNumber(e164, fallbackCode);
      return {
        ...p,
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
  const contactWithId = await prepareContactRecord(contact, contact.id);
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  const contacts = parsed.success ? (parsed.data as Contact[]) : [];
  const index = contacts.findIndex((c) => String(c.id) === String(contactWithId.id));
  const created = index < 0;
  const restoredFromDelete = !created && Boolean(contacts[index]?.deletedAt);
  if (created) {
    contacts.push(contactWithId);
  } else {
    contacts[index] = { ...contacts[index], ...contactWithId, deletedAt: undefined, deletedBy: undefined };
  }
  const saved = contacts[index >= 0 ? index : contacts.length - 1];
  await persistCollection('contacts', contacts);
  await invalidateDuplicateScanCache();
  return { contact: saved, created, restoredFromDelete: restoredFromDelete || undefined };
}

export async function updateContactById(id: string, contact: Contact): Promise<Contact | null> {
  const contactWithId = await prepareContactRecord({ ...contact, id }, id);
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  const contacts = parsed.success ? (parsed.data as Contact[]) : [];
  const index = contacts.findIndex((c) => String(c.id) === id && !c.deletedAt);
  if (index < 0) {
    return null;
  }
  contacts[index] = contactWithId;
  await persistCollection('contacts', contacts);
  await invalidateDuplicateScanCache();
  return contactWithId;
}

export async function restoreContactById(id: string, _restoredBy: string): Promise<Contact | null> {
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  const contacts = parsed.success ? (parsed.data as Contact[]) : [];
  const index = contacts.findIndex((c) => String(c.id) === id);
  if (index < 0) return null;
  const existing = contacts[index];
  if (!existing.deletedAt) return existing;

  const now = new Date().toISOString();
  const restored: Contact = {
    ...existing,
    deletedAt: undefined,
    deletedBy: undefined,
    deletionReason: undefined,
    updatedAt: now,
  };
  contacts[index] = restored;
  await persistCollection('contacts', contacts);
  await invalidateDuplicateScanCache();
  return restored;
}

export async function bulkRestoreContacts(
  ids: string[],
  _restoredBy: string,
): Promise<{ succeeded: number; failed: number }> {
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  const contacts = parsed.success ? (parsed.data as Contact[]) : [];
  let succeeded = 0;
  const idSet = new Set(ids.map(String));
  const now = new Date().toISOString();

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    if (!idSet.has(String(contact.id)) || !contact.deletedAt) continue;
    contacts[i] = {
      ...contact,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionReason: undefined,
      updatedAt: now,
    };
    succeeded += 1;
    idSet.delete(String(contact.id));
  }
  const failed = idSet.size;

  if (succeeded > 0) {
    await persistCollection('contacts', contacts);
    await invalidateDuplicateScanCache();
  }
  return { succeeded, failed };
}

export async function softDeleteContactById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  const contacts = parsed.success ? (parsed.data as Contact[]) : [];
  const index = contacts.findIndex((c) => String(c.id) === id && !c.deletedAt);
  if (index < 0) {
    return false;
  }
  const trimmedReason = deletionReason?.trim();
  contacts[index] = {
    ...contacts[index],
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: trimmedReason || undefined,
  };
  await persistCollection('contacts', contacts);
  await invalidateDuplicateScanCache();
  return true;
}

export async function bulkSoftDeleteContacts(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
): Promise<{ succeeded: number; failed: number }> {
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  const contacts = parsed.success ? (parsed.data as Contact[]) : [];
  let succeeded = 0;
  const idSet = new Set(ids.map(String));
  const now = new Date().toISOString();
  const trimmedReason = deletionReason?.trim();

  for (const contact of contacts) {
    if (!idSet.has(String(contact.id)) || contact.deletedAt) continue;
    contact.deletedAt = now;
    contact.deletedBy = deletedBy;
    contact.deletionReason = trimmedReason || undefined;
    succeeded += 1;
    idSet.delete(String(contact.id));
  }
  const failed = idSet.size;

  if (succeeded > 0) {
    await persistCollection('contacts', contacts);
    await invalidateDuplicateScanCache();
  }
  return { succeeded, failed };
}
