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
  filterActiveContacts,
  isContactDeleted,
  paginateContacts,
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
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listContactsByWorkspace,
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
