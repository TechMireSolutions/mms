export { contactRowToRecord } from './contactRepositoryMappers.js';
export {
  hydrateContact,
  hydrateContactsList,
  hydrateContactsSummaryList,
  type ListByWorkspaceOptions,
  listContactsByWorkspace,
  countContactsByWorkspace,
  findContactById,
  findContactsByIds,
} from './contactRepositoryHydrate.js';
export {
  persistContactTx,
  saveContact,
  bulkSaveContacts,
  replaceContactsForWorkspace,
  contactRepo,
} from './contactRepositoryPersist.js';
