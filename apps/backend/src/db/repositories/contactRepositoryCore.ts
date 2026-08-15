import {
  hydrateContactRelationshipFields,
  type Contact,
} from '@mms/shared';
import { contacts } from '../schema.js';
import { createGenericRepository, type ListByWorkspaceOptions } from './genericRepository.js';

export const contactRepo = createGenericRepository<Contact, typeof contacts>(contacts, {
  updateStrategy: 'overwrite',
  conflictTarget: [contacts.workspaceSubdomain, contacts.id],
  syncDeletedAtColumn: true,
});

export function hydrateContact(contact: Contact): Contact {
  return hydrateContactRelationshipFields(contact);
}

export async function listContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<Contact[]> {
  const rows = await contactRepo.listByWorkspace(tenant, options);
  return rows.map(hydrateContact);
}

export async function countContactsByWorkspace(
  tenant: string,
  options?: ListByWorkspaceOptions,
): Promise<number> {
  return contactRepo.countByWorkspace(tenant, options);
}

export async function findContactById(tenant: string, id: string): Promise<Contact | null> {
  const row = await contactRepo.findById(tenant, id);
  return row ? hydrateContact(row) : null;
}

export async function findContactsByIds(tenant: string, ids: string[]): Promise<Contact[]> {
  const rows = await contactRepo.findByIds(tenant, ids);
  return rows.map(hydrateContact);
}

export async function saveContact(tenant: string, contact: Contact): Promise<void> {
  await contactRepo.save(tenant, hydrateContact(contact));
}

export async function bulkSaveContacts(tenant: string, records: Contact[]): Promise<void> {
  await contactRepo.bulkSave(tenant, records.map(hydrateContact));
}

export const replaceContactsForWorkspace = contactRepo.replaceForWorkspace;
