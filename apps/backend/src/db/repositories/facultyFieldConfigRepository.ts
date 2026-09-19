import { teacherFieldConfigs } from '../schema.js';
import { createWorkspaceSingletonJsonRepo } from './moduleSetupRepoFactories.js';

const repo = createWorkspaceSingletonJsonRepo({
  table: teacherFieldConfigs,
  jsonColumn: 'config',
});

export const getFacultyFieldConfigByWorkspace = repo.getByWorkspace;
export const upsertFacultyFieldConfig = repo.upsert;
export const listAllFacultyFieldConfigsByWorkspace = repo.listAllByWorkspace;
export const replaceFacultyFieldConfigsForWorkspace = repo.replaceForWorkspace;

export const getTeacherFieldConfigByWorkspace = getFacultyFieldConfigByWorkspace;
export const upsertTeacherFieldConfig = upsertFacultyFieldConfig;
export const listAllTeacherFieldConfigsByWorkspace = listAllFacultyFieldConfigsByWorkspace;
export const replaceTeacherFieldConfigsForWorkspace = replaceFacultyFieldConfigsForWorkspace;
