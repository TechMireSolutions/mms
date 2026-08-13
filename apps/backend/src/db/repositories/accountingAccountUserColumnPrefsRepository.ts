import { accountingAccountUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: accountingAccountUserColumnPrefs });

export const getAccountingAccountUserColumnPrefs = repo.get;
export const setAccountingAccountUserColumnPrefs = repo.set;
export const listAllAccountingAccountUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceAccountingAccountUserColumnPrefsForWorkspace = repo.replaceForWorkspace;