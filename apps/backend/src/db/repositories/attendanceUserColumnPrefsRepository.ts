import { attendanceUserColumnPrefs } from '../schema.js';
import { createUserColumnPrefsRepo } from './moduleSetupRepoFactories.js';

const repo = createUserColumnPrefsRepo({ table: attendanceUserColumnPrefs });

export const getAttendanceUserColumnPrefs = repo.get;
export const setAttendanceUserColumnPrefs = repo.set;
export const listAllAttendanceUserColumnPrefsByWorkspace = repo.listAllByWorkspace;
export const replaceAttendanceUserColumnPrefsForWorkspace = repo.replaceForWorkspace;