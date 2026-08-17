import { obligationsUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({
  table: obligationsUserColumnPrefs as never,
});

export const getObligationsUserColumnPrefs = repo.get;
export const setObligationsUserColumnPrefs = repo.set;
export const replaceObligationsUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
export const listAllObligationsUserColumnPrefsByWorkspace = repo.listAllByWorkspace;