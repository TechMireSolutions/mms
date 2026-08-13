import { examinationResultsUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: examinationResultsUserColumnPrefs });

export const getExaminationResultsUserColumnPrefs = repo.get;
export const setExaminationResultsUserColumnPrefs = repo.set;
export const listAllExaminationResultsUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceExaminationResultsUserColumnPrefsForWorkspace = repo.replaceForWorkspace;