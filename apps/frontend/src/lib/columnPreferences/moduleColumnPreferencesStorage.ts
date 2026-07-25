import type { ModuleColumnPref, ModuleColumnRegistryEntry } from '@mms/shared';

const storageKey = (moduleId: string, userId: string) => `mms_${moduleId}_columns_${userId}`;

interface RawColumnPreference {
  key: string;
  enabled?: boolean | string | number;
  order?: number | string;
}

function isRawColumnPreference(item: unknown): item is RawColumnPreference {
  if (!item || typeof item !== 'object') return false;
  const key = (item as Record<string, unknown>).key;
  return typeof key === 'string' && key.trim().length > 0;
}

function parseColumnPref(pref: RawColumnPreference, defaultOrder: number): ModuleColumnPref {
  const enabled =
    typeof pref.enabled === 'boolean'
      ? pref.enabled
      : pref.enabled === 'true' || pref.enabled === 1 || pref.enabled === '1';

  const parsedOrder =
    typeof pref.order === 'number'
      ? pref.order
      : parseFloat(String(pref.order ?? ''));

  const order = Number.isFinite(parsedOrder) && parsedOrder >= 0
    ? Math.floor(parsedOrder)
    : defaultOrder;

  return {
    key: pref.key.trim(),
    enabled,
    order,
  };
}

export function sanitizeModuleColumnPrefs(prefs: unknown[]): ModuleColumnPref[] {
  if (!Array.isArray(prefs)) return [];
  return prefs
    .filter(isRawColumnPreference)
    .map((pref, index) => parseColumnPref(pref, index));
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

