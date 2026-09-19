import type { TeacherLookupKind } from '@mms/shared';
import { teacherLookups } from '../schema.js';
import {
  createModuleLookupsRepo,
  type ModuleLookupRowInput,
  type ModuleLookupDbRow,
} from './moduleSetupRepoFactories.js';

export type { ModuleLookupDbRow as LookupDbRow };

export interface FacultyLookupRowInput extends Omit<ModuleLookupRowInput, 'kind'> {
  kind: TeacherLookupKind;
}
export type TeacherLookupRowInput = FacultyLookupRowInput;

const repo = createModuleLookupsRepo({ table: teacherLookups });

export const listFacultyLookupsByWorkspace = (ws: string): Promise<ModuleLookupDbRow[]> =>
  repo.listByWorkspace(ws);
export const listFacultyLookupsByKind = (
  workspaceSubdomain: string,
  kind: TeacherLookupKind,
): Promise<ModuleLookupDbRow[]> => repo.listByKind(workspaceSubdomain, kind);
export const replaceFacultyLookupsForKind = (
  workspaceSubdomain: string,
  kind: TeacherLookupKind,
  rows: FacultyLookupRowInput[],
) => repo.replaceForKind(workspaceSubdomain, kind, rows);
/** Full-workspace list for admin backup snapshots. */
export const listAllFacultyLookupsByWorkspace = repo.listAllByWorkspace;
/** Admin restore wipe+replace for the whole workspace. */
export const replaceFacultyLookupsForWorkspace = repo.replaceForWorkspace;

export const listTeacherLookupsByWorkspace = listFacultyLookupsByWorkspace;
export const listTeacherLookupsByKind = listFacultyLookupsByKind;
export const replaceTeacherLookupsForKind = replaceFacultyLookupsForKind;
export const listAllTeacherLookupsByWorkspace = listAllFacultyLookupsByWorkspace;
export const replaceTeacherLookupsForWorkspace = replaceFacultyLookupsForWorkspace;
