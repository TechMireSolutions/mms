import type { ModuleColumnPreference, UserModuleColumnPreferencesMap } from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';

async function loadUserColumnPreferencesMap(objectKey: string): Promise<UserModuleColumnPreferencesMap> {
  const raw = await fetchObject(objectKey);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserModuleColumnPreferencesMap;
  }
  return {};
}

async function saveUserColumnPreferencesMap(
  objectKey: string,
  preferencesByUser: UserModuleColumnPreferencesMap,
): Promise<void> {
  await persistObject(objectKey, preferencesByUser);
}

export async function getUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
): Promise<ModuleColumnPreference[]> {
  const preferencesByUser = await loadUserColumnPreferencesMap(objectKey);
  const preferences = preferencesByUser[userId];
  if (!Array.isArray(preferences)) return [];
  return preferences.filter(
    (preference): preference is ModuleColumnPreference =>
      preference != null &&
      typeof preference === 'object' &&
      typeof preference.key === 'string' &&
      typeof preference.enabled === 'boolean' &&
      typeof preference.order === 'number',
  );
}

export async function setUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
  preferences: ModuleColumnPreference[],
): Promise<void> {
  const preferencesByUser = await loadUserColumnPreferencesMap(objectKey);
  preferencesByUser[userId] = preferences;
  await saveUserColumnPreferencesMap(objectKey, preferencesByUser);
}
