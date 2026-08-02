import type { Contact, RelationshipContact } from './contactEntityTypes.js';

/**
 * Resolves relationship links from `relationshipContacts`, falling back to legacy
 * `emergencyContacts` on stored contact JSONB. Strips the legacy key from the result.
 */
export function hydrateContactRelationshipFields<T extends Partial<Contact> | Record<string, unknown>>(
  contact: T,
): T {
  if (!contact || typeof contact !== 'object') return contact;

  const record = { ...contact } as T & {
    relationshipContacts?: RelationshipContact[];
    emergencyContacts?: RelationshipContact[];
  };

  if (!Array.isArray(record.relationshipContacts) && Array.isArray(record.emergencyContacts)) {
    record.relationshipContacts = record.emergencyContacts;
  }

  delete record.emergencyContacts;
  return record;
}
