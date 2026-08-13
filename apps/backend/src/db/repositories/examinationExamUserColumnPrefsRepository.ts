import { examinationExamUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: examinationExamUserColumnPrefs });

export const getExaminationExamUserColumnPrefs = repo.get;
export const setExaminationExamUserColumnPrefs = repo.set;
export const listAllExaminationExamUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceExaminationExamUserColumnPrefsForWorkspace = repo.replaceForWorkspace;