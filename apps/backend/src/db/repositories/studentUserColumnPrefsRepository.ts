import { studentUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: studentUserColumnPrefs });

export const getStudentUserColumnPrefs = repo.get;
export const setStudentUserColumnPrefs = repo.set;
export const listAllStudentUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceStudentUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
