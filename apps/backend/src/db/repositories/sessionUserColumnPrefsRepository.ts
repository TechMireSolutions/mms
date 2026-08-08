import { sessionUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: sessionUserColumnPrefs });

export const getSessionUserColumnPrefs = repo.get;
export const setSessionUserColumnPrefs = repo.set;
export const listAllSessionUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceSessionUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
