import { financePaymentUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: financePaymentUserColumnPrefs });

export const getFinancePaymentUserColumnPrefs = repo.get;
export const setFinancePaymentUserColumnPrefs = repo.set;
export const listAllFinancePaymentUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceFinancePaymentUserColumnPrefsForWorkspace = repo.replaceForWorkspace;