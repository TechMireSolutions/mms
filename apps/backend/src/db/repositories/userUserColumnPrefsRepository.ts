import { userUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: userUserColumnPrefs });

export const getUserUserColumnPrefs = repo.get;
export const setUserUserColumnPrefs = repo.set;
export const listAllUserUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceUserUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
