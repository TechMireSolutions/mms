import { getDefaultCollectionsForSeed, getDefaultObjects } from '../db/seeds.js';
import { WORKSPACES_COLLECTION } from '@mms/shared';

/**
 * Empty collections with default settings objects only — no demo records.
 */
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
  return getDefaultObjects();
}
