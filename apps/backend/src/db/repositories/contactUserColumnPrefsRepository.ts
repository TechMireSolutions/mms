import { contactUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: contactUserColumnPrefs });

export const getContactUserColumnPrefs = repo.get;
export const setContactUserColumnPrefs = repo.set;
export const listAllContactUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceContactUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
