import type { TeacherLookupKind } from '@mms/shared';
import { teacherLookups } from '../schema.js';
import {
  createModuleLookupsRepo,
  type ModuleLookupRowInput,
} from './moduleSetupRepoFactories.js';

type LookupDbRow = {
  id: string;
  workspaceSubdomain: string;
  kind: string;
  label: string;
  meta: Record<string, unknown> | null;
  sortOrder: number;
  updatedAt: Date;
};

export interface TeacherLookupRowInput extends Omit<ModuleLookupRowInput, 'kind'> {
  kind: TeacherLookupKind;
}

const repo = createModuleLookupsRepo({ table: teacherLookups });

export const listTeacherLookupsByWorkspace = ((ws: string) => repo.listByWorkspace(ws)) as (
  ws: string,
) => Promise<LookupDbRow[]>;
export const listTeacherLookupsByKind = (
  workspaceSubdomain: string,
  kind: TeacherLookupKind,
): Promise<LookupDbRow[]> =>
  repo.listByKind(workspaceSubdomain, kind) as Promise<LookupDbRow[]>;
export const replaceTeacherLookupsForKind = (
  workspaceSubdomain: string,
  kind: TeacherLookupKind,
  rows: TeacherLookupRowInput[],
) => repo.replaceForKind(workspaceSubdomain, kind, rows);
/** Full-workspace list for admin backup snapshots. */
export const listAllTeacherLookupsByWorkspace = repo.listAllByWorkspace;
/** Admin restore wipe+replace for the whole workspace. */
export const replaceTeacherLookupsForWorkspace = repo.replaceForWorkspace;
