import { financeUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({
  table: financeUserColumnPrefs,
});

export const getFinanceUserColumnPrefs = repo.get;
export const setFinanceUserColumnPrefs = repo.set;
export const listAllFinanceUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceFinanceUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
