import { getDefaultCollectionsForSeed, getDefaultObjects } from '../db/seeds.js';
import {
  DEFAULT_STUDENTS_SETTINGS,
  DEFAULT_TEACHERS_SETTINGS,
  WORKSPACES_COLLECTION,
} from '@mms/shared';

/** Empty collections plus default settings objects — no demo roster on new madrasa onboard. */
export async function getMinimalCollectionsForSeed(): Promise<Record<string, unknown[]>> {
  const full = await getDefaultCollectionsForSeed();
  const minimal: Record<string, unknown[]> = {};
  for (const name of Object.keys(full)) {
    if (name === WORKSPACES_COLLECTION) continue;
    minimal[name] = [];
  }
  return minimal;
}

export function getMinimalObjects(): Record<string, unknown> {
  const objects = getDefaultObjects();
  return {
    ...objects,
    teachers_settings: objects.teachers_settings ?? DEFAULT_TEACHERS_SETTINGS,
    students_settings: objects.students_settings ?? DEFAULT_STUDENTS_SETTINGS,
  };
}
