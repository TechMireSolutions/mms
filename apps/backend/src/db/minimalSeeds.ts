import { getDefaultCollectionsForSeed, getDefaultObjects } from '../db/seeds.js';
import { DEMO_TEACHERS, DEFAULT_TEACHERS_SETTINGS, WORKSPACES_COLLECTION } from '@mms/shared';

/**
 * Empty collections with default settings objects only — no demo records,
 * except `teachers` which ships a small faculty demo set aligned with session seeds.
 */
export async function getMinimalCollectionsForSeed(): Promise<Record<string, unknown[]>> {
  const full = await getDefaultCollectionsForSeed();
  const minimal: Record<string, unknown[]> = {};
  for (const name of Object.keys(full)) {
    if (name === WORKSPACES_COLLECTION) continue;
    minimal[name] = [];
  }
  minimal.teachers = [...DEMO_TEACHERS];
  return minimal;
}

export function getMinimalObjects(): Record<string, unknown> {
  const objects = getDefaultObjects();
  if (objects.teachers_settings) return objects;
  return { ...objects, teachers_settings: DEFAULT_TEACHERS_SETTINGS };
}
