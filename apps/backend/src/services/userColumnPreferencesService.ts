import type { ModuleColumnPref, UserModuleColumnPrefsMap } from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';

async function loadMap(objectKey: string): Promise<UserModuleColumnPrefsMap> {
  const raw = await fetchObject(objectKey);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserModuleColumnPrefsMap;
  }
  return {};
}

async function saveMap(objectKey: string, map: UserModuleColumnPrefsMap): Promise<void> {
  await persistObject(objectKey, map);
}

export async function getUserColumnPrefsForModule(
  objectKey: string,
  userId: string,
): Promise<ModuleColumnPref[]> {
  const map = await loadMap(objectKey);
  const prefs = map[userId];
  if (!Array.isArray(prefs)) return [];
  return prefs.filter(
    (p): p is ModuleColumnPref =>
      p != null &&
      typeof p === 'object' &&
      typeof p.key === 'string' &&
      typeof p.enabled === 'boolean' &&
      typeof p.order === 'number',
  );
}

export async function setUserColumnPrefsForModule(
  objectKey: string,
  userId: string,
  prefs: ModuleColumnPref[],
): Promise<void> {
  const map = await loadMap(objectKey);
  map[userId] = prefs;
  await saveMap(objectKey, map);
}
