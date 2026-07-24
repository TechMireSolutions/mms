import { type Contact } from '@mms/shared';
import { contacts } from '../schema.js';
import { createGenericRepository } from './genericRepository.js';

const repo = createGenericRepository<Contact, typeof contacts>(contacts, {
  updateStrategy: 'overwrite',
  conflictTarget: [contacts.workspaceSubdomain, contacts.id],
});

export const listContactsByWorkspace = repo.listByWorkspace;
export const findContactById = repo.findById;
export const findContactsByIds = repo.findByIds;
export const saveContact = repo.save;
export const bulkSaveContacts = repo.bulkSave;
export const deleteContact = repo.deleteById;
export const replaceContactsForWorkspace = repo.replaceForWorkspace;
export const deleteContactsByWorkspace = repo.deleteByWorkspace;
