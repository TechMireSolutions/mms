import { enrollmentUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: enrollmentUserColumnPrefs });

export const getEnrollmentUserColumnPrefs = repo.get;
export const setEnrollmentUserColumnPrefs = repo.set;
export const listAllEnrollmentUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceEnrollmentUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
