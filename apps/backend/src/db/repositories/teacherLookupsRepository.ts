import type { TeacherLookupKind } from '@mms/shared';
import { teacherLookups } from '../schema.js';
import {
  createModuleLookupsRepo,
  type ModuleLookupRowInput,
  type ModuleLookupDbRow,
} from './moduleSetupRepoFactories.js';

export type { ModuleLookupDbRow as LookupDbRow };

export interface TeacherLookupRowInput extends Omit<ModuleLookupRowInput, 'kind'> {
  kind: TeacherLookupKind;
}

const repo = createModuleLookupsRepo({ table: teacherLookups });

export const listTeacherLookupsByWorkspace = (ws: string): Promise<ModuleLookupDbRow[]> =>
  repo.listByWorkspace(ws);
export const listTeacherLookupsByKind = (
  workspaceSubdomain: string,
  kind: TeacherLookupKind,
): Promise<ModuleLookupDbRow[]> => repo.listByKind(workspaceSubdomain, kind);
export const replaceTeacherLookupsForKind = (
  workspaceSubdomain: string,
  kind: TeacherLookupKind,
  rows: TeacherLookupRowInput[],
) => repo.replaceForKind(workspaceSubdomain, kind, rows);
/** Full-workspace list for admin backup snapshots. */
export const listAllTeacherLookupsByWorkspace = repo.listAllByWorkspace;
/** Admin restore wipe+replace for the whole workspace. */
export const replaceTeacherLookupsForWorkspace = repo.replaceForWorkspace;
