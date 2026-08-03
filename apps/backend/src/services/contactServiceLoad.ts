import {
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
  countFieldUsageByKeys,
} from '../db/repositories/contactRepository.js';
import {
  aggregateContactsCommandMetrics,
  aggregateContactsMonthlyCreatedCounts,
  aggregateContactsReportAnalytics,
  aggregateContactsWidgetQueries,
} from '../db/repositories/contactRepositoryAggregates.js';
import {
  listActiveStudentContactIds,
  listActiveTeacherContactIds,
} from '../db/repositories/moduleLinkedContactIds.js';

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
    excludeIds.push(...(await listActiveStudentContactIds(tenant)));
  }
  if (query.excludeLinkedModules?.includes('teachers')) {
    excludeIds.push(...(await listActiveTeacherContactIds(tenant)));
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
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      total: 0,
      newThisPeriod: 0,
      whatsappCount: 0,
      incompleteCount: 0,
      duplicatePairCount: 0,
    };
  }
  // Dynamic import avoids cycle: duplicateScan → contactService → contactServiceLoad.
  const [{ getDuplicateScanCache }, fieldConfig] = await Promise.all([
    import('./contactDuplicateScanService.js'),
    loadContactFieldConfig(),
  ]);
  const dupeCache = await getDuplicateScanCache();
  // Actionable pairs only (exclude name-only) — cache when warm; 0 when cold (no full-tenant scan).
  const duplicatePairCount = dupeCache
    ? dupeCache.pairs.filter((pair) => pair.reasonKey !== 'name').length
    : 0;
  return aggregateContactsCommandMetrics(tenant, metricsFieldConfig(fieldConfig), {
    duplicatePairCount,
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
  language?: string;
}): Promise<{ analytics: ContactsReportAnalyticsSnapshot; monthlyByYear?: ContactsMonthlyYearCounts[] }> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      analytics: {
        total: 0,
        activeCount: 0,
        whatsappCount: 0,
        whatsappRate: 0,
        missingInfoCount: 0,
        newLast30Days: 0,
        newPrior30Days: 0,
        newThisPeriod: 0,
        hasSignupDates: false,
        growthRecentSignups30d: 0,
        growthPriorSignups30d: 0,
      },
    };
  }

  const analytics = await aggregateContactsReportAnalytics(tenant);
  const years = options?.compareYears?.filter(Boolean) ?? [];
  if (years.length === 0) {
    return { analytics };
  }

  const language = options?.language || 'en';
  const monthlyByYear = await aggregateContactsMonthlyCreatedCounts(tenant, years, 6, language);
  return { analytics, monthlyByYear };
}

export async function loadContactFieldUsageCounts(
  fieldKeys: string[],
): Promise<Record<string, number>> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return Object.fromEntries(fieldKeys.map((key) => [key, 0]));
  }
  return countFieldUsageByKeys(tenant, fieldKeys);
}

export async function loadContactFieldUsageCount(fieldKey: string): Promise<number> {
  const counts = await loadContactFieldUsageCounts([fieldKey]);
  return counts[fieldKey] ?? 0;
}

export async function loadContactsWidgetAggregates(
  queries: ContactsWidgetQuery[],
): Promise<Record<string, ContactsWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateContactsWidgetQueries(tenant, queries);
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
