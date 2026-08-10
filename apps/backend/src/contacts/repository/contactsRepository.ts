import type {
  Contact,
  ContactsCommandMetricsSnapshot,
  ContactsListPageResult,
  ContactsListQuery,
  ContactsMonthlyYearCounts,
  ContactsReportAnalyticsSnapshot,
  ContactsWidgetAggregateResult,
  ContactsWidgetQuery,
  FieldConfig,
} from '@mms/shared';
import type { ContactDuplicateCandidateKeys, ContactUniqueLookupValues } from '../../db/repositories/contactRepository.js';

/** Soft-delete visibility filter shared by list/count repository reads. */
type ContactDeletedFilter = 'active' | 'deleted' | 'all';

interface ListContactsOptions {
  deleted?: ContactDeletedFilter;
}

/**
 * Sole gateway to contact storage.
 *
 * Use cases depend on this interface — never on concrete Drizzle functions —
 * so persistence can be swapped (tests, future data source) without touching
 * domain orchestration. The Drizzle implementation lives in
 * `contactsRepositoryAdapter.ts`.
 */
export interface ContactsRepository {
  countByWorkspace(tenant: string, options?: ListContactsOptions): Promise<number>;
  listPage(tenant: string, query: ContactsListQuery): Promise<ContactsListPageResult>;
  findById(tenant: string, id: string): Promise<Contact | null>;
  findByIds(tenant: string, ids: string[]): Promise<Contact[]>;
  save(tenant: string, contact: Contact): Promise<void>;
  bulkSave(tenant: string, contacts: Contact[]): Promise<void>;

  findExistingNormalizedContactNames(tenant: string, names: string[]): Promise<Set<string>>;
  findActiveContactsMatchingUniqueValues(
    tenant: string,
    values: ContactUniqueLookupValues,
    excludeIds?: Array<string | number>,
  ): Promise<Contact[]>;
  findContactDuplicateCandidateIds(
    tenant: string,
    keys: ContactDuplicateCandidateKeys,
    excludeIds?: Array<string | number>,
  ): Promise<string[]>;
  findContactDuplicateBlockedIds(tenant: string, namePrefixes: string[]): Promise<string[]>;
  countFieldUsageByKeys(tenant: string, fieldKeys: string[]): Promise<Record<string, number>>;

  aggregateCommandMetrics(
    tenant: string,
    fieldConfig: FieldConfig,
    options?: { periodDays?: number; duplicatePairCount?: number },
  ): Promise<ContactsCommandMetricsSnapshot>;
  aggregateReportAnalytics(
    tenant: string,
    options?: { periodDays?: number; referenceDate?: Date },
  ): Promise<ContactsReportAnalyticsSnapshot>;
  aggregateMonthlyCreatedCounts(
    tenant: string,
    years: number[],
    monthCount?: number,
    language?: string,
  ): Promise<ContactsMonthlyYearCounts[]>;
  aggregateWidgetQueries(
    tenant: string,
    queries: ContactsWidgetQuery[],
  ): Promise<Record<string, ContactsWidgetAggregateResult>>;
}
