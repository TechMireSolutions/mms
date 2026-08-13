import type { AttendanceLookupKind } from '@mms/shared';
import { attendanceLookups } from '../schema.js';
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

export interface AttendanceLookupRowInput extends Omit<ModuleLookupRowInput, 'kind'> {
  kind: AttendanceLookupKind;
}

const repo = createModuleLookupsRepo({ table: attendanceLookups });

export const listAttendanceLookupsByWorkspace = ((ws: string) => repo.listByWorkspace(ws)) as (
  ws: string,
) => Promise<LookupDbRow[]>;
export const listAttendanceLookupsByKind = (
  workspaceSubdomain: string,
  kind: AttendanceLookupKind,
): Promise<LookupDbRow[]> =>
  repo.listByKind(workspaceSubdomain, kind) as Promise<LookupDbRow[]>;
export const replaceAttendanceLookupsForKind = (
  workspaceSubdomain: string,
  kind: AttendanceLookupKind,
  rows: AttendanceLookupRowInput[],
) => repo.replaceForKind(workspaceSubdomain, kind, rows);
/** Full-workspace list for admin backup snapshots. */
export const listAllAttendanceLookupsByWorkspace = repo.listAllByWorkspace;
/** Admin restore wipe+replace for the whole workspace. */
export const replaceAttendanceLookupsForWorkspace = repo.replaceForWorkspace;
