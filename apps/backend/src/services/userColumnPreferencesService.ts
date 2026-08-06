import type { ModuleColumnPreference, UserModuleColumnPreferencesMap } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST, STUDENTS_MODULE_MANIFEST } from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  getContactUserColumnPrefs,
  setContactUserColumnPrefs,
} from '../db/repositories/contactUserColumnPrefsRepository.js';
import {
  getStudentUserColumnPrefs,
  setStudentUserColumnPrefs,
} from '../db/repositories/studentUserColumnPrefsRepository.js';
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

function filterPreferences(preferences: unknown[]): ModuleColumnPreference[] {
  return preferences.filter((preference): preference is ModuleColumnPreference => {
    if (preference == null || typeof preference !== 'object') return false;
    const record = preference as Record<string, unknown>;
    return (
      typeof record.key === 'string' &&
      typeof record.enabled === 'boolean' &&
      typeof record.order === 'number'
    );
  });
}

function isContactsColumnKey(objectKey: string): boolean {
  return objectKey === CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function isStudentsColumnKey(objectKey: string): boolean {
  return objectKey === STUDENTS_MODULE_MANIFEST.columnPreferencesObjectKey;
}

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant.trim().toLowerCase();
}

export async function getUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
): Promise<ModuleColumnPreference[]> {
  if (isContactsColumnKey(objectKey)) {
    const prefs = await getContactUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  if (isStudentsColumnKey(objectKey)) {
    const prefs = await getStudentUserColumnPrefs(requireTenant(), userId);
    return filterPreferences(prefs);
  }
  const preferencesByUser = await loadUserColumnPreferencesMap(objectKey);
  const preferences = preferencesByUser[userId];
  if (!Array.isArray(preferences)) return [];
  return filterPreferences(preferences);
}

export async function setUserColumnPreferencesForModule(
  objectKey: string,
  userId: string,
  preferences: ModuleColumnPreference[],
): Promise<void> {
  if (isContactsColumnKey(objectKey)) {
    await setContactUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  if (isStudentsColumnKey(objectKey)) {
    await setStudentUserColumnPrefs(requireTenant(), userId, preferences);
    return;
  }
  const preferencesByUser = await loadUserColumnPreferencesMap(objectKey);
  preferencesByUser[userId] = preferences;
  await saveUserColumnPreferencesMap(objectKey, preferencesByUser);
}
