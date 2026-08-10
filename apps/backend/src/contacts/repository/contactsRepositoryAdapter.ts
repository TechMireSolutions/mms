import {
  countContactsByWorkspace,
  findContactById,
  findContactsByIds,
  saveContact,
  bulkSaveContacts,
  findExistingNormalizedContactNames,
  findActiveContactsMatchingUniqueValues,
  findContactDuplicateCandidateIds,
  findContactDuplicateBlockedIds,
  countFieldUsageByKeys,
  listContactsPage,
} from '../../db/repositories/contactRepository.js';
import {
  aggregateContactsCommandMetrics,
  aggregateContactsReportAnalytics,
  aggregateContactsMonthlyCreatedCounts,
  aggregateContactsWidgetQueries,
} from '../../db/repositories/contactRepositoryAggregates.js';
import type { ContactsRepository } from './contactsRepository.js';

/**
 * Drizzle adapter for `ContactsRepository`.
 *
 * Delegates to the existing tenant-scoped Drizzle repository functions; the
 * interface is the contract use cases depend on (SSOT storage gateway).
 */
function createContactsRepository(): ContactsRepository {
  return {
    countByWorkspace: (tenant, options) => countContactsByWorkspace(tenant, options),
    listPage: (tenant, query) => listContactsPage(tenant, query),
    findById: (tenant, id) => findContactById(tenant, id),
    findByIds: (tenant, ids) => findContactsByIds(tenant, ids),
    save: (tenant, contact) => saveContact(tenant, contact),
    bulkSave: (tenant, contacts) => bulkSaveContacts(tenant, contacts),
    findExistingNormalizedContactNames: (tenant, names) =>
      findExistingNormalizedContactNames(tenant, names),
    findActiveContactsMatchingUniqueValues: (tenant, values, excludeIds) =>
      findActiveContactsMatchingUniqueValues(tenant, values, excludeIds),
    findContactDuplicateCandidateIds: (tenant, keys, excludeIds) =>
      findContactDuplicateCandidateIds(tenant, keys, excludeIds),
    findContactDuplicateBlockedIds: (tenant, namePrefixes) =>
      findContactDuplicateBlockedIds(tenant, namePrefixes),
    countFieldUsageByKeys: (tenant, fieldKeys) => countFieldUsageByKeys(tenant, fieldKeys),
    aggregateCommandMetrics: (tenant, fieldConfig, options) =>
      aggregateContactsCommandMetrics(tenant, fieldConfig, options),
    aggregateReportAnalytics: (tenant, options) =>
      aggregateContactsReportAnalytics(tenant, options),
    aggregateMonthlyCreatedCounts: (tenant, years, monthCount, language) =>
      aggregateContactsMonthlyCreatedCounts(tenant, years, monthCount, language),
    aggregateWidgetQueries: (tenant, queries) => aggregateContactsWidgetQueries(tenant, queries),
  };
}

/** Default Drizzle-backed instance used by the production use-case layer. */
export const contactsRepository: ContactsRepository = createContactsRepository();
