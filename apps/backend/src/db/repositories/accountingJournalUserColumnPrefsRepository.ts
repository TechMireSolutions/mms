import { accountingJournalUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: accountingJournalUserColumnPrefs });

export const getAccountingJournalUserColumnPrefs = repo.get;
export const setAccountingJournalUserColumnPrefs = repo.set;
export const listAllAccountingJournalUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceAccountingJournalUserColumnPrefsForWorkspace = repo.replaceForWorkspace;