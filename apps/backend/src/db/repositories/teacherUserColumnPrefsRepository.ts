import { teacherUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: teacherUserColumnPrefs });

export const getTeacherUserColumnPrefs = repo.get;
export const setTeacherUserColumnPrefs = repo.set;
export const listAllTeacherUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceTeacherUserColumnPrefsForWorkspace = repo.replaceForWorkspace;
