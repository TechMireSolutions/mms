/** Contact load, prepare, upsert, and soft-delete service API. */
export type { ContactRuntimeDefaults } from './contactServiceLoad.js';
export {
  loadContacts,
  loadContactsPage,
  loadContactsCommandMetrics,
  loadContactRuntimeDefaults,
  loadContactsReportAnalytics,
  loadContactFieldUsageCount,
  loadContactFieldUsageCounts,
  loadContactsWidgetAggregates,
  loadContactsByIds,
  loadContactDuplicatePairsPage,
  getContactById,
  countContacts,
} from './contactServiceLoad.js';
export type { UpsertContactOptions } from './contactServiceMutate.js';
export {
  ContactPermissionError,
  normalizeContactPhones,
  prepareContactRecord,
  upsertContact,
  updateContactById,
  mergeContactsById,
  restoreContactById,
  bulkRestoreContacts,
  softDeleteContactById,
  bulkSoftDeleteContacts,
} from './contactServiceMutate.js';
export {
  ContactUniqueFieldError,
  assertContactUniqueFields,
} from './contactUniqueValidationService.js';
