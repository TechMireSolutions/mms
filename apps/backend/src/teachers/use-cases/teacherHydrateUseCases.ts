import { hydrateTeacherFromContact, type Contact, type Teacher } from '@mms/shared';
import { contactUseCases } from '../../contacts/use-cases/contactUseCases.js';

/**
 * Single-pass hydrate: loads the linked contacts through the contacts composition
 * root (never raw Drizzle) and fills display profile fields on the teacher rows.
 * The tenant is passed explicitly so hydration works outside a tenant-scoped
 * request (background jobs, scripts, tests).
 */
export async function hydrateTeachersFromContacts(
  tenant: string,
  rows: Teacher[],
): Promise<Teacher[]> {
  if (rows.length === 0) return [];

  const ids = new Set<string>();
  for (const row of rows) {
    if (row.contactId != null && row.contactId !== '') ids.add(String(row.contactId));
  }
  if (ids.size === 0) return rows;

  const contacts = (await contactUseCases.loadContactsByIdsForTenant(tenant, [...ids])) as Contact[];
  return rows.map((row) => hydrateTeacherFromContact(row, contacts as never));
}
