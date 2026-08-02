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

  const modern = record.relationshipContacts;
  const legacy = record.emergencyContacts;
  const hasModern = Array.isArray(modern);
  const hasLegacy = Array.isArray(legacy);

  if (hasModern && modern.length > 0) {
    record.relationshipContacts = modern;
  } else if (hasLegacy) {
    record.relationshipContacts = legacy;
  } else if (hasModern) {
    record.relationshipContacts = modern;
  }

  delete record.emergencyContacts;
  return record;
}
