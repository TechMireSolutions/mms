import type { ContactsRepository } from '../repository/contactsRepository.js';
import { contactsRepository } from '../repository/contactsRepositoryAdapter.js';
import * as loadUseCases from './contactLoadUseCases.js';
import * as writeUseCases from './contactWriteUseCases.js';
import * as softDeleteUseCases from './contactSoftDeleteUseCases.js';
import * as identityUseCases from './contactIdentityMatchUseCases.js';
import * as uniqueFieldUseCases from './contactUniqueFieldUseCases.js';

// Barrel — raw functions keep the repository interface as a trailing DI param.
export * from './contactLoadUseCases.js';
export * from './contactWriteUseCases.js';
export * from './contactSoftDeleteUseCases.js';
export * from './contactNormalizeUseCases.js';
export * from './contactUniqueFieldUseCases.js';
export * from './contactRelationshipInferenceUseCases.js';
export * from './contactIdentityMatchUseCases.js';
export * from './contactDuplicateScanUseCases.js';

/**
 * Composition root — binds a `ContactsRepository` to every use case.
 *
 * Production uses the default Drizzle-backed `contactUseCases`; tests can pass a
 * fake repository to exercise use-case orchestration in isolation.
 */
export function createContactsUseCases(repo: ContactsRepository = contactsRepository) {
  return {
    countContacts: (options?: { includeDeleted?: boolean }) => loadUseCases.countContacts(options, repo),
    loadContactsPage: (query: Parameters<typeof loadUseCases.loadContactsPage>[0]) =>
      loadUseCases.loadContactsPage(query, repo),
    loadContactsPageForTenant: (tenant: string, query: Parameters<typeof loadUseCases.loadContactsPageForTenant>[1]) =>
      loadUseCases.loadContactsPageForTenant(tenant, query, repo),
    loadContactsByIdsForTenant: (tenant: string, ids: string[]) =>
      loadUseCases.loadContactsByIdsForTenant(tenant, ids, repo),
    loadContactsCommandMetrics: () => loadUseCases.loadContactsCommandMetrics(repo),
    loadContactRuntimeDefaults: () => loadUseCases.loadContactRuntimeDefaults(),
    loadContactsReportAnalytics: (options?: Parameters<typeof loadUseCases.loadContactsReportAnalytics>[0]) =>
      loadUseCases.loadContactsReportAnalytics(options, repo),
    loadContactFieldUsageCounts: (fieldKeys: string[]) =>
      loadUseCases.loadContactFieldUsageCounts(fieldKeys, repo),
    loadContactFieldUsageCount: (fieldKey: string) =>
      loadUseCases.loadContactFieldUsageCount(fieldKey, repo),
    loadContactsWidgetAggregates: (queries: Parameters<typeof loadUseCases.loadContactsWidgetAggregates>[0]) =>
      loadUseCases.loadContactsWidgetAggregates(queries, repo),
    loadContactsByIds: (ids: string[]) => loadUseCases.loadContactsByIds(ids, repo),
    loadExistingNormalizedContactNames: (names: string[]) =>
      loadUseCases.loadExistingNormalizedContactNames(names, repo),
    loadContactDuplicatePairsPage: (query: { page?: number; limit?: number }) =>
      loadUseCases.loadContactDuplicatePairsPage(query, repo),
    getContactById: (id: string, includeDeleted?: boolean) =>
      loadUseCases.getContactById(id, includeDeleted, repo),
    upsertContact: (contact: Parameters<typeof writeUseCases.upsertContact>[0], options?: Parameters<typeof writeUseCases.upsertContact>[1]) =>
      writeUseCases.upsertContact(contact, options, repo),
    updateContactById: (id: string, contact: Parameters<typeof writeUseCases.updateContactById>[1], languageOrOptions?: Parameters<typeof writeUseCases.updateContactById>[2]) =>
      writeUseCases.updateContactById(id, contact, languageOrOptions, repo),
    mergeContactsById: (keepId: string, deleteId: string, mergedInput: Parameters<typeof writeUseCases.mergeContactsById>[2], deletedBy: string) =>
      writeUseCases.mergeContactsById(keepId, deleteId, mergedInput, deletedBy, repo),
    bulkSaveContacts: (contacts: Parameters<typeof writeUseCases.bulkSaveContacts>[0]) =>
      writeUseCases.bulkSaveContacts(contacts, repo),
    restoreContactById: (id: string) =>
      softDeleteUseCases.restoreContactById(id, repo),
    bulkRestoreContacts: (ids: string[]) =>
      softDeleteUseCases.bulkRestoreContacts(ids, repo),
    softDeleteContactById: (id: string, deletedBy: string, deletionReason?: string) =>
      softDeleteUseCases.softDeleteContactById(id, deletedBy, deletionReason, repo),
    bulkSoftDeleteContacts: (ids: string[], deletedBy: string, deletionReason?: string) =>
      softDeleteUseCases.bulkSoftDeleteContacts(ids, deletedBy, deletionReason, repo),
    matchContactIdentityIndex: (candidates: Parameters<typeof identityUseCases.matchContactIdentityIndex>[0]) =>
      identityUseCases.matchContactIdentityIndex(candidates, repo),
    assertContactUniqueFields: (tenant: string, contact: Parameters<typeof uniqueFieldUseCases.assertContactUniqueFields>[1], languageOrOptions?: Parameters<typeof uniqueFieldUseCases.assertContactUniqueFields>[2], excludeContactIdsArg?: Parameters<typeof uniqueFieldUseCases.assertContactUniqueFields>[3]) =>
      uniqueFieldUseCases.assertContactUniqueFields(tenant, contact, languageOrOptions, excludeContactIdsArg, repo),
  };
}

type ContactsUseCases = ReturnType<typeof createContactsUseCases>;

/** Default Drizzle-backed use-case instance used by routes and cross-module services. */
export const contactUseCases: ContactsUseCases = createContactsUseCases();
