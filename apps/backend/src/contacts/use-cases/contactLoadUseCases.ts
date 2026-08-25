import {
  DEFAULT_ENABLED_TABS,
  DEFAULT_FORM_TABS,
  DEFAULT_REQUIRED_TABS,
  type Contact,
  type ContactsDuplicatePairsPageResult,
  type ContactsListQuery,
  type ContactsListPageResult,
  type ContactsCommandMetricsSnapshot,
  type ContactsMonthlyYearCounts,
  type ContactsReportAnalyticsSnapshot,
  type ContactsWidgetAggregateResult,
  type ContactsWidgetQuery,
  type FieldConfig,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { loadContactFieldConfig } from '../../lib/contactConfigService.js';
import { loadContactLookupKind } from '../../lib/contactLookupsService.js';
import { loadContactPreferences } from '../../lib/contactPreferencesService.js';
import { loadDuplicatePairsPage, getDuplicateScanCache } from './contactDuplicateScanUseCases.js';
import type { ContactsRepository } from '../repository/contactsRepository.js';
import { contactsRepository } from '../repository/contactsRepositoryAdapter.js';

/** Active (or deleted-only) contact count via SQL — avoids loading every row. */
export async function countContacts(
  options?: { includeDeleted?: boolean },
  repo: ContactsRepository = contactsRepository,
): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  const deleted = options?.includeDeleted ? 'deleted' : 'active';
  return repo.countByWorkspace(tenant, { deleted });
}

export async function loadContactsPage(
  query: ContactsListQuery,
  repo: ContactsRepository = contactsRepository,
): Promise<ContactsListPageResult> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { contacts: [], total: 0, page: query.page ?? 1, limit: query.limit ?? 50, hasMore: false };
  }
  return repo.listPage(tenant, query);
}

export async function loadContactsByIds(
  ids: string[],
  repo: ContactsRepository = contactsRepository,
): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return loadContactsByIdsForTenant(tenant, ids, repo);
}

/** Tenant-parameterized variant for cross-module services (e.g. Messaging recipients). */
export async function loadContactsByIdsForTenant(
  tenant: string,
  ids: string[],
  repo: ContactsRepository = contactsRepository,
): Promise<Contact[]> {
  if (ids.length === 0) return [];
  const matched = await repo.findByIds(tenant, ids);
  return matched.filter((contact) => !contact.deletedAt);
}

export async function loadContactsPageForTenant(
  tenant: string,
  query: ContactsListQuery,
  repo: ContactsRepository = contactsRepository,
): Promise<ContactsListPageResult> {
  return repo.listPage(tenant, query);
}

export async function loadContactDuplicatePairsPage(
  query: { page?: number; limit?: number },
  repo: ContactsRepository = contactsRepository,
): Promise<ContactsDuplicatePairsPageResult> {
  return loadDuplicatePairsPage(query, repo);
}

/** Existing normalized contact names (Google sync dedupe) via SQL — no full-set hydrate. */
export async function loadExistingNormalizedContactNames(
  names: string[],
  repo: ContactsRepository = contactsRepository,
): Promise<Set<string>> {
  const tenant = getRequestTenant();
  if (!tenant || names.length === 0) return new Set<string>();
  return repo.findExistingNormalizedContactNames(tenant, names);
}

/** Active contacts matching candidate phone numbers, emails, or scalar fields (for dedupe & sync). */
export async function findContactsMatchingUniqueValues(
  values: {
    phoneDigits?: string[];
    emails?: string[];
    scalars?: Array<{ fieldKey: string; normalized: string }>;
  },
  excludeIds: Array<string | number> = [],
  repo: ContactsRepository = contactsRepository,
): Promise<Contact[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return repo.findActiveContactsMatchingUniqueValues(
    tenant,
    {
      phoneDigits: values.phoneDigits ?? [],
      emails: values.emails ?? [],
      scalars: values.scalars ?? [],
    },
    excludeIds,
  );
}

export async function getContactById(
  id: string,
  includeDeleted = false,
  repo: ContactsRepository = contactsRepository,
): Promise<Contact | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const found = await repo.findById(tenant, id);
  if (!found) return null;
  if (!includeDeleted && found.deletedAt) return null;
  return found;
}

export interface ContactRuntimeDefaults {
  defaultPhoneCountryCode: string;
  phoneLabel: string;
  emailLabel: string;
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

export async function loadContactsCommandMetrics(
  repo: ContactsRepository = contactsRepository,
): Promise<ContactsCommandMetricsSnapshot> {
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
  const fieldConfig = await loadContactFieldConfig();
  const dupeCache = await getDuplicateScanCache();
  // Actionable pairs only (exclude name-only) — cache when warm; 0 when cold (no full-tenant scan).
  const duplicatePairCount = dupeCache
    ? dupeCache.pairs.filter((pair) => pair.reasonKey !== 'name').length
    : 0;
  return repo.aggregateCommandMetrics(tenant, metricsFieldConfig(fieldConfig), {
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
    loadContactLookupKind('countryCodes'),
    loadContactLookupKind('phoneLabels'),
    loadContactLookupKind('emailLabels'),
    loadContactPreferences(),
  ]);

  return {
    defaultPhoneCountryCode: resolveDefaultPhoneCountryCode(
      countryCodes as unknown[],
      preferences?.defaultCountry?.trim() ?? '',
    ),
    phoneLabel: firstCollectionString(phoneLabels as unknown[]),
    emailLabel: firstCollectionString(emailLabels as unknown[]),
  };
}

export async function loadContactsReportAnalytics(
  options?: {
    compareYears?: number[];
    language?: string;
  },
  repo: ContactsRepository = contactsRepository,
): Promise<{ analytics: ContactsReportAnalyticsSnapshot; monthlyByYear?: ContactsMonthlyYearCounts[] }> {
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

  const analytics = await repo.aggregateReportAnalytics(tenant);
  const years = options?.compareYears?.filter(Boolean) ?? [];
  if (years.length === 0) {
    return { analytics };
  }

  const language = options?.language || 'en';
  const monthlyByYear = await repo.aggregateMonthlyCreatedCounts(tenant, years, 6, language);
  return { analytics, monthlyByYear };
}

export async function loadContactsWidgetAggregates(
  queries: ContactsWidgetQuery[],
  repo: ContactsRepository = contactsRepository,
): Promise<Record<string, ContactsWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return repo.aggregateWidgetQueries(tenant, queries);
}
