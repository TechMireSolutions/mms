import { teacherModulePreferences } from '../schema.js';
import { createWorkspaceSingletonJsonRepo } from './moduleSetupRepoFactories.js';

const repo = createWorkspaceSingletonJsonRepo({
  table: teacherModulePreferences,
  jsonColumn: 'preferences',
});

export const getTeacherModulePreferencesByWorkspace = repo.getByWorkspace;
export const upsertTeacherModulePreferences = repo.upsert;
export const listAllTeacherModulePreferencesByWorkspace = repo.listAllByWorkspace;
export const replaceTeacherModulePreferencesForWorkspace = repo.replaceForWorkspace;
