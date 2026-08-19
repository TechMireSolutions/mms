import { sql } from 'drizzle-orm';
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
  reparentContactReferences,
  listContactsPage,
} from '../../db/repositories/contactRepository.js';
import {
  aggregateContactsCommandMetrics,
  aggregateContactsReportAnalytics,
  aggregateContactsMonthlyCreatedCounts,
  aggregateContactsWidgetQueries,
} from '../../db/repositories/contactRepositoryAggregates.js';
import { withTenantTransaction } from '../../db/withTenantTransaction.js';
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
    reparentContactReferences: (tenant, keepId, deleteId) =>
      reparentContactReferences(tenant, keepId, deleteId),
    acquireUniqueValueLocks: async (tenant, lockKeys) => {
      if (lockKeys.length === 0) return;
      const subdomain = tenant.trim().toLowerCase();
      const sorted = [...new Set(lockKeys.map((key) => key.trim()).filter(Boolean))].sort();
      await withTenantTransaction(subdomain, async (tx) => {
        for (const key of sorted) {
          await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${subdomain}), hashtext(${key}))`);
        }
      });
    },
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
