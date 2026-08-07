import type { ContactLookupKind } from '@mms/shared';
import { contactLookups } from '../schema.js';
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

export interface ContactLookupRowInput extends Omit<ModuleLookupRowInput, 'kind'> {
  kind: ContactLookupKind;
}

const repo = createModuleLookupsRepo({ table: contactLookups });

export const listContactLookupsByWorkspace = ((ws: string) => repo.listByWorkspace(ws)) as (ws: string) => Promise<LookupDbRow[]>;
export const listContactLookupsByKind = (
  workspaceSubdomain: string,
  kind: ContactLookupKind,
): Promise<LookupDbRow[]> =>
  repo.listByKind(workspaceSubdomain, kind) as Promise<LookupDbRow[]>;
export const replaceContactLookupsForKind = (
  workspaceSubdomain: string,
  kind: ContactLookupKind,
  rows: ContactLookupRowInput[],
) => repo.replaceForKind(workspaceSubdomain, kind, rows);
/** Full-workspace list for admin backup snapshots. */
export const listAllContactLookupsByWorkspace = repo.listAllByWorkspace;
/** Admin restore wipe+replace for the whole workspace. */
export const replaceContactLookupsForWorkspace = repo.replaceForWorkspace;
