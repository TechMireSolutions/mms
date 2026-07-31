/** Contact load, prepare, upsert, and soft-delete service API. */
export type { ContactRuntimeDefaults } from './contactServiceLoad.js';
export {
  loadContacts,
  loadContactsPage,
  loadContactsCommandMetrics,
  loadContactRuntimeDefaults,
  loadContactsReportAnalytics,
  loadContactFieldUsageCount,
  loadContactsWidgetAggregates,
  loadContactsByIds,
  loadContactDuplicatePairsPage,
  getContactById,
} from './contactServiceLoad.js';
export type { UpsertContactOptions } from './contactServiceMutate.js';
export {
  ContactPermissionError,
  normalizeContactPhones,
  prepareContactRecord,
  stripClientSoftDeleteFields,
  mergeContactPatch,
  upsertContact,
  updateContactById,
  mergeContactsById,
  restoreContactById,
  bulkRestoreContacts,
  softDeleteContactById,
  bulkSoftDeleteContacts,
} from './contactServiceMutate.js';
