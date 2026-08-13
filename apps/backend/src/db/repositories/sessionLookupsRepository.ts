import type { SessionLookupKind } from '@mms/shared';
import { sessionLookups } from '../schema.js';
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

export interface SessionLookupRowInput extends Omit<ModuleLookupRowInput, 'kind'> {
  kind: SessionLookupKind;
}

const repo = createModuleLookupsRepo({ table: sessionLookups });

export const listSessionLookupsByWorkspace = ((ws: string) => repo.listByWorkspace(ws)) as (
  ws: string,
) => Promise<LookupDbRow[]>;
export const listSessionLookupsByKind = (
  workspaceSubdomain: string,
  kind: SessionLookupKind,
): Promise<LookupDbRow[]> =>
  repo.listByKind(workspaceSubdomain, kind) as Promise<LookupDbRow[]>;
export const replaceSessionLookupsForKind = (
  workspaceSubdomain: string,
  kind: SessionLookupKind,
  rows: SessionLookupRowInput[],
) => repo.replaceForKind(workspaceSubdomain, kind, rows);
/** Full-workspace list for admin backup snapshots. */
export const listAllSessionLookupsByWorkspace = repo.listAllByWorkspace;
/** Admin restore wipe+replace for the whole workspace. */
export const replaceSessionLookupsForWorkspace = repo.replaceForWorkspace;
