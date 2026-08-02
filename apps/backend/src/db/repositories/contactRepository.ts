import { type Contact, hydrateContactRelationshipFields } from '@mms/shared';
import { contacts } from '../schema.js';
import { createGenericRepository, type ListByWorkspaceOptions } from './genericRepository.js';

const repo = createGenericRepository<Contact, typeof contacts>(contacts, {
  updateStrategy: 'overwrite',
  conflictTarget: [contacts.workspaceSubdomain, contacts.id],
  syncDeletedAtColumn: true,
});

function hydrateContact(contact: Contact): Contact {
  return hydrateContactRelationshipFields(contact) as Contact;
}

export async function listContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<Contact[]> {
  const rows = await repo.listByWorkspace(tenant, options);
  return rows.map(hydrateContact);
}

export async function findContactById(tenant: string, id: string): Promise<Contact | null> {
  const row = await repo.findById(tenant, id);
  return row ? hydrateContact(row) : null;
}

export async function findContactsByIds(tenant: string, ids: string[]): Promise<Contact[]> {
  const rows = await repo.findByIds(tenant, ids);
  return rows.map(hydrateContact);
}

export async function saveContact(tenant: string, contact: Contact): Promise<void> {
  await repo.save(tenant, hydrateContact(contact));
}

export async function bulkSaveContacts(tenant: string, records: Contact[]): Promise<void> {
  await repo.bulkSave(tenant, records.map(hydrateContact));
}

export const deleteContact = repo.deleteById;
export const replaceContactsForWorkspace = repo.replaceForWorkspace;
export const deleteContactsByWorkspace = repo.deleteByWorkspace;
