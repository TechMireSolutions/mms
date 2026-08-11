/**
 * Contacts use-case seam (Clean Architecture).
 *
 * The feature module lives under `src/contacts/`: repository interface +
 * Drizzle adapter in `src/contacts/repository/`, orchestration use cases in
 * `src/contacts/use-cases/`. This file keeps the historical public import path
 * stable for routes and cross-module services while binding every export to
 * the composition-root instance (`contactUseCases`) — the single production
 * entry to the use-case layer.
 */
import { contactUseCases } from '../contacts/use-cases/contactUseCases.js';

export const {
  loadContactsPage,
  loadContactsPageForTenant,
  loadContactsByIdsForTenant,
  loadContactRuntimeDefaults,
  loadContactsByIds,
  loadExistingNormalizedContactNames,
  getContactById,
  upsertContact,
  updateContactById,
  restoreContactById,
  bulkRestoreContacts,
  bulkSoftDeleteContacts,
  bulkSaveContacts,
  applyContactRelationshipInference,
} = contactUseCases;

// Non-instance exports kept on the stable path (routes + cross-module services).
export {
  ContactUniqueFieldError,
} from '../contacts/use-cases/contactUniqueFieldUseCases.js';
export {
  ContactPermissionError,
  prepareContactRecord,
} from '../contacts/use-cases/contactNormalizeUseCases.js';
export type {
  ContactRuntimeDefaults,
} from '../contacts/use-cases/contactUseCases.js';
