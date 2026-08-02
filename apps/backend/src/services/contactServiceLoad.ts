import {
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
import { loadContactPreferences } from './contactPreferencesService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listContactsByWorkspace,
  listContactsPage,
  countContactsByWorkspace,
  findContactById,
  findContactsByIds,
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
  const deleted = options?.includeDeleted ? 'deleted' : 'active';
  return listContactsByWorkspace(tenant, { deleted });
}

/** Active (or deleted-only) contact count via SQL — avoids loading every row. */
export async function countContacts(options?: { includeDeleted?: boolean }): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  const deleted = options?.includeDeleted ? 'deleted' : 'active';
  return countContactsByWorkspace(tenant, { deleted });
}

export async function loadContactsPage(query: ContactsListQuery): Promise<ContactsListPageResult> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { contacts: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
  }

  const excludeIds = [...(query.excludeIds ?? [])];
  if (query.excludeLinkedModules?.includes('students')) {
    const students = await listStudentsByWorkspace(tenant, { deleted: 'active' });
    excludeIds.push(...collectStudentLinkedContactIds(students));
  }
  if (query.excludeLinkedModules?.includes('teachers')) {
    const teachers = await listTeachersByWorkspace(tenant, { deleted: 'active' });
    excludeIds.push(...collectTeacherLinkedContactIds(teachers));
  }
  const { excludeLinkedModules: _excludeLinkedModules, ...pageQuery } = query;
  return listContactsPage(tenant, {
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
  const [fieldConfig, preferences] = await Promise.all([
    loadContactFieldConfig(),
    loadContactPreferences(),
  ]);
  return computeContactsCommandMetrics(contacts, {
    fieldConfig: metricsFieldConfig(fieldConfig),
    duplicateDetectionPreferences: preferences ?? undefined,
  });
}

function firstString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function firstCollectionString(rows: unknown[] | null): string {
  return firstString(rows?.[0]);
}

function resolveDefaultPhoneCountryCode(
  countryCodes: unknown[] | null,
  defaultCountry: string,
): string {
  if (!countryCodes || !Array.isArray(countryCodes)) return '';
  const entries = countryCodes.filter(
    (entry): entry is { country: string; code: string } =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as { country?: unknown }).country === 'string' &&
      typeof (entry as { code?: unknown }).code === 'string',
  );
  if (defaultCountry) {
    const matched = entries.find((entry) => entry.country === defaultCountry && entry.code);
    if (matched?.code) return matched.code;
  }
  return entries.find((entry) => entry.code)?.code ?? '';
}

export async function loadContactRuntimeDefaults(): Promise<ContactRuntimeDefaults> {
  const [countryCodes, phoneLabels, emailLabels, preferences] = await Promise.all([
    fetchCollection('countryCodes'),
    fetchCollection('phoneLabels'),
    fetchCollection('emailLabels'),
    loadContactPreferences(),
  ]);

  return {
    defaultPhoneCountryCode: resolveDefaultPhoneCountryCode(
      countryCodes,
      preferences?.defaultCountry?.trim() ?? '',
    ),
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
