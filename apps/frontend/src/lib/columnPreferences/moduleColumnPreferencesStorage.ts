import type { ModuleColumnPref, ModuleColumnRegistryEntry } from '@mms/shared';

const storageKey = (moduleId: string, userId: string) => `mms_${moduleId}_columns_${userId}`;

export function sanitizeModuleColumnPrefs(prefs: any[]): ModuleColumnPref[] {
  if (!Array.isArray(prefs)) return [];
  return prefs
    .filter((columnPreference) => columnPreference && typeof columnPreference === "object" && typeof columnPreference.key === "string" && columnPreference.key.trim().length > 0)
    .map((columnPreference, index) => {
      const enabled = typeof columnPreference.enabled === "boolean"
        ? columnPreference.enabled
        : columnPreference.enabled === "true" || columnPreference.enabled === 1 || columnPreference.enabled === "1";
      const rawOrder = typeof columnPreference.order === "number" ? columnPreference.order : parseFloat(String(columnPreference.order));
      const order = Number.isFinite(rawOrder) && rawOrder >= 0 ? Math.floor(rawOrder) : index;
      return {
        key: columnPreference.key.trim(),
        enabled,
        order,
      };
    });
}

export function loadModuleColumnPrefs(moduleId: string, userId: string): ModuleColumnPref[] | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(moduleId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return sanitizeModuleColumnPrefs(parsed);
  } catch {
    return null;
  }
}

export function saveModuleColumnPrefList(
  moduleId: string,
  userId: string,
  prefs: ModuleColumnPref[],
): void {
  if (!userId) return;
  const sanitized = sanitizeModuleColumnPrefs(prefs);
  localStorage.setItem(storageKey(moduleId, userId), JSON.stringify(sanitized));
}

export function saveModuleColumnRegistry(
  moduleId: string,
  userId: string,
  registry: ModuleColumnRegistryEntry[],
): void {
  const prefs: ModuleColumnPref[] = registry.map(({ key, enabled, order }) => ({
    key,
    enabled,
    order,
  }));
  saveModuleColumnPrefList(moduleId, userId, prefs);
}

export const loadModuleColumnPreferences = loadModuleColumnPrefs;
export const saveModuleColumnPreferenceList = saveModuleColumnPrefList;
