import { teacherFieldConfigs } from '../schema.js';
import { createWorkspaceSingletonJsonRepo } from './moduleSetupRepoFactories.js';

const repo = createWorkspaceSingletonJsonRepo({
  table: teacherFieldConfigs,
  jsonColumn: 'config',
});

export const getTeacherFieldConfigByWorkspace = repo.getByWorkspace;
export const upsertTeacherFieldConfig = repo.upsert;
export const listAllTeacherFieldConfigsByWorkspace = repo.listAllByWorkspace;
export const replaceTeacherFieldConfigsForWorkspace = repo.replaceForWorkspace;
