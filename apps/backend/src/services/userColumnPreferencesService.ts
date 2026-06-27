import type { ModuleColumnPreference, UserModuleColumnPreferencesMap } from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';

async function loadMap(objectKey: string): Promise<UserModuleColumnPreferencesMap> {
  const raw = await fetchObject(objectKey);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserModuleColumnPreferencesMap;
  }
  return {};
}

async function saveMap(objectKey: string, map: UserModuleColumnPreferencesMap): Promise<void> {
  await persistObject(objectKey, map);
}

export async function getUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
): Promise<ModuleColumnPreference[]> {
  const map = await loadMap(objectKey);
  const preferences = map[userId];
  if (!Array.isArray(preferences)) return [];
  return preferences.filter(
    (p): p is ModuleColumnPreference =>
      p != null &&
      typeof p === 'object' &&
      typeof p.key === 'string' &&
      typeof p.enabled === 'boolean' &&
      typeof p.order === 'number',
  );
}

export async function setUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
  preferences: ModuleColumnPreference[],
): Promise<void> {
  const map = await loadMap(objectKey);
  map[userId] = preferences;
  await saveMap(objectKey, map);
}
