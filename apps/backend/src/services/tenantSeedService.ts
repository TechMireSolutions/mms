import { WORKSPACES_COLLECTION } from '@mms/shared';
import { getMinimalCollectionsForSeed, getMinimalObjects } from '../db/minimalSeeds.js';
import { getCollection, getObject, saveCollection, saveObject } from '../db/database.js';
/**
 * Seeds default collections and objects for a new tenant workspace.
 * Caller must bind tenant context via `runWithTenant` first.
 */
export async function seedTenantDefaults(): Promise<void> {
  const collections = await getMinimalCollectionsForSeed();
  for (const [name, data] of Object.entries(collections)) {
    if (name === WORKSPACES_COLLECTION) continue;
    const existing = await getCollection(name);
    if (Array.isArray(existing) && existing.length > 0) continue;
    await saveCollection(name, data as unknown[]);
  }

  const objects = getMinimalObjects();
  for (const [key, data] of Object.entries(objects)) {
    const existing = await getObject(key);
    if (existing !== null && existing !== undefined) continue;
    await saveObject(key, data);
  }
}
