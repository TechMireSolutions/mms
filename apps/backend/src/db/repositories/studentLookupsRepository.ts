import type { StudentLookupKind } from '@mms/shared';
import { studentLookups } from '../schema.js';
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

interface StudentLookupRowInput extends Omit<ModuleLookupRowInput, 'kind'> {
  kind: StudentLookupKind;
}

const repo = createModuleLookupsRepo({ table: studentLookups });

export const listStudentLookupsByWorkspace = ((ws: string) => repo.listByWorkspace(ws)) as (ws: string) => Promise<LookupDbRow[]>;
export const listStudentLookupsByKind = (
  workspaceSubdomain: string,
  kind: StudentLookupKind,
): Promise<LookupDbRow[]> =>
  repo.listByKind(workspaceSubdomain, kind) as Promise<LookupDbRow[]>;
export const replaceStudentLookupsForKind = (
  workspaceSubdomain: string,
  kind: StudentLookupKind,
  rows: StudentLookupRowInput[],
) => repo.replaceForKind(workspaceSubdomain, kind, rows);
/** Full-workspace list for admin backup snapshots. */
export const listAllStudentLookupsByWorkspace = repo.listAllByWorkspace;
/** Admin restore wipe+replace for the whole workspace. */
export const replaceStudentLookupsForWorkspace = repo.replaceForWorkspace;
