import { userModulePreferences } from '../schema.js';
import { createWorkspaceSingletonJsonRepo } from './moduleSetupRepoFactories.js';

const repo = createWorkspaceSingletonJsonRepo({
  table: userModulePreferences,
  jsonColumn: 'preferences',
});

export const getUserModulePreferencesByWorkspace = repo.getByWorkspace;
export const upsertUserModulePreferences = repo.upsert;
export const listAllUserModulePreferencesByWorkspace = repo.listAllByWorkspace;
export const replaceUserModulePreferencesForWorkspace = repo.replaceForWorkspace;
