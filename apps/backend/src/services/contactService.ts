import {
  applyTitleCaseToContact,
  collectStudentLinkedContactIds,
  collectTeacherLinkedContactIds,
  computeContactsCommandMetrics,
  computeContactsMonthlyCreatedCounts,
  computeContactsReportAnalytics,
  computeContactsWidgetAggregates,
  countContactsWithFieldValue,
  DEFAULT_ENABLED_TABS,
  DEFAULT_FORM_TABS,
  DEFAULT_REQUIRED_TABS,
  filterActiveContacts,
  isContactDeleted,
  paginateContacts,
  parsePhoneNumber,
  stripContactRetiredClassificationFields,
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
  type User,
} from '@mms/shared';
import { fetchCollection } from './dbSyncService.js';
import { loadContactFieldConfig } from './contactConfigService.js';
import { invalidateDuplicateScanCache } from './contactDuplicateScanService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { applyContactRelationshipInference } from './contactRelationshipInferenceService.js';
import { runInTransaction } from '../db/database.js';
import { canDeleteContacts } from './rbacService.js';
import {
  listContactsByWorkspace,
  findContactById,
  saveContact,
  findContactsByIds,
  bulkSaveContacts,
} from '../db/repositories/contactRepository.js';
import { listStudentsByWorkspace } from '../db/repositories/studentRepository.js';
import { listTeachersByWorkspace } from '../db/repositories/teacherRepository.js';

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
  const tenant = getRequestTenant();
  const all = await loadContacts({ includeDeleted: query.includeDeleted });
  const scoped = query.includeDeleted ? all.filter(isContactDeleted) : all;
  const excludeIds = [...(query.excludeIds ?? [])];
  if (tenant && query.excludeLinkedModules?.includes('students')) {
    const students = (await listStudentsByWorkspace(tenant)).filter((row) => !row.deletedAt);
    excludeIds.push(...collectStudentLinkedContactIds(students));
  }
  if (tenant && query.excludeLinkedModules?.includes('teachers')) {
    const teachers = (await listTeachersByWorkspace(tenant)).filter((row) => !row.deletedAt);
    excludeIds.push(...collectTeacherLinkedContactIds(teachers));
  }
  const { excludeLinkedModules: _excludeLinkedModules, ...pageQuery } = query;
  return paginateContacts(scoped, {
    ...pageQuery,
    excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
  });
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
  if (!rows || !Array.isArray(rows)) return '';
  const first = rows.find(
    (entry): entry is { code: string } =>
      Boolean(entry) && typeof entry === 'object' && typeof (entry as { code?: unknown }).code === 'string',
  );
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
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const matched = await findContactsByIds(tenant, ids);
  return matched.filter((contact) => !contact.deletedAt);
}

export async function loadContactDuplicatePairsPage(query: {
  page?: number;
  limit?: number;
}): Promise<ContactsDuplicatePairsPageResult> {
  const { loadDuplicatePairsPage } = await import('./contactDuplicateScanService.js');
  return loadDuplicatePairsPage(query);
}

export async function getContactById(id: string, includeDeleted = false): Promise<Contact | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const found = await findContactById(tenant, id);
  if (!found) return null;
  if (!includeDeleted && found.deletedAt) return null;
  return found;
}

export async function normalizeContactPhones(contact: Contact): Promise<Contact> {
  let phones = contact.phones;
  const scalarPhone = typeof contact.phone === 'string' ? contact.phone.trim() : '';

  if ((!phones || !phones.length) && scalarPhone) {
    phones = [{ label: 'Mobile', number: scalarPhone, countryCode: '+92', isPrimary: true }];
  }

  if (!phones?.length) {
    return { ...contact, phones: phones || [] };
  }
  const { defaultPhoneCountryCode } = await loadContactRuntimeDefaults();
  const countryCodes = (await fetchCollection('countryCodes')) || [];
  const knownCodes = countryCodes
    .map((row) => (row && typeof row === 'object' && typeof (row as { code?: unknown }).code === 'string' ? String((row as { code: string }).code) : ''))
    .filter(Boolean);

  return {
    ...contact,
    phones: phones.map((phone) => {
      const fallbackCode = phone.countryCode || defaultPhoneCountryCode;
      const trimmedNumber = (phone.number || '').trim();
      const parsed = parsePhoneNumber(trimmedNumber, fallbackCode, knownCodes);
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
  const titled = applyTitleCaseToContact({ ...withPhones, id: resolvedId }) as Contact;
  return stripContactRetiredClassificationFields({ ...titled }) as Contact;
}

export interface UpsertContactOptions {
  user?: User;
  canRestore?: boolean;
}

export async function upsertContact(
  contact: Contact,
  options?: User | UpsertContactOptions,
): Promise<{
  contact: Contact;
  created: boolean;
  restoredFromDelete?: boolean;
}> {
  return runInTransaction(async () => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('Tenant context required');
    const contactWithId = await prepareContactRecord(contact, contact.id);
    const existing = await findContactById(tenant, String(contactWithId.id));
    const created = !existing;
    const restoredFromDelete = existing && Boolean(existing.deletedAt);

    const user = options && 'role' in options ? (options as User) : (options as UpsertContactOptions)?.user;
    const explicitCanRestore = options && !('role' in options) ? (options as UpsertContactOptions)?.canRestore : undefined;

    if (restoredFromDelete) {
      if (explicitCanRestore === false) {
        throw new Error('Permission denied: Restoring soft-deleted contacts requires delete permissions');
      }
      if (user && !canDeleteContacts(user)) {
        throw new Error('Permission denied: Restoring soft-deleted contacts requires delete permissions');
      }
    }

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
  });
}

export async function updateContactById(id: string, contact: Contact): Promise<Contact | null> {
  return runInTransaction(async () => {
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
  });
}

export async function restoreContactById(id: string, restoredBy: string): Promise<Contact | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findContactById(tenant, id);
  if (!existing) return null;
  if (!existing.deletedAt) return existing;

  const result = await bulkRestoreContacts([id], restoredBy);
  if (result.succeeded === 1) {
    return findContactById(tenant, id);
  }
  return null;
}

export async function bulkRestoreContacts(
  ids: string[],
  _restoredBy: string,
): Promise<{ succeeded: number; failed: number }> {
  return runInTransaction(async () => {
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
  });
}

export async function softDeleteContactById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const result = await bulkSoftDeleteContacts([id], deletedBy, deletionReason);
  return result.succeeded === 1;
}

export async function bulkSoftDeleteContacts(
  ids: string[],
  deletedBy: string,
  deletionReason?: string,
): Promise<{ succeeded: number; failed: number }> {
  return runInTransaction(async () => {
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
  });
}
