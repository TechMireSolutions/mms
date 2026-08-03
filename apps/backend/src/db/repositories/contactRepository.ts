/** Contact repository public surface — list, CRUD, uniqueness lookups. */
export {
  listContactsByWorkspace,
  countContactsByWorkspace,
  findContactById,
  findContactsByIds,
  saveContact,
  bulkSaveContacts,
  deleteContact,
  replaceContactsForWorkspace,
  deleteContactsByWorkspace,
} from './contactRepositoryCore.js';
export { listContactsPage } from './contactRepositoryList.js';
export type { ContactUniqueLookupValues } from './contactRepositoryLookup.js';
export {
  findExistingNormalizedContactNames,
  findActiveContactsMatchingUniqueValues,
  countFieldUsageByKeys,
} from './contactRepositoryLookup.js';
