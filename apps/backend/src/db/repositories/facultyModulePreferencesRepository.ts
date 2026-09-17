import { teacherModulePreferences } from '../schema.js';
import { createWorkspaceSingletonJsonRepo } from './moduleSetupRepoFactories.js';

const repo = createWorkspaceSingletonJsonRepo({
  table: teacherModulePreferences,
  jsonColumn: 'preferences',
});

export const getFacultyModulePreferencesByWorkspace = repo.getByWorkspace;
export const upsertFacultyModulePreferences = repo.upsert;
export const listAllFacultyModulePreferencesByWorkspace = repo.listAllByWorkspace;
export const replaceFacultyModulePreferencesForWorkspace = repo.replaceForWorkspace;

export const getTeacherModulePreferencesByWorkspace = getFacultyModulePreferencesByWorkspace;
export const upsertTeacherModulePreferences = upsertFacultyModulePreferences;
export const listAllTeacherModulePreferencesByWorkspace = listAllFacultyModulePreferencesByWorkspace;
export const replaceTeacherModulePreferencesForWorkspace = replaceFacultyModulePreferencesForWorkspace;
