import { questionBankUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: questionBankUserColumnPrefs });

export const getQuestionBankUserColumnPrefs = repo.get;
export const setQuestionBankUserColumnPrefs = repo.set;
export const listAllQuestionBankUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceQuestionBankUserColumnPrefsForWorkspace = repo.replaceForWorkspace;