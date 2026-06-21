import type { ColumnRegistryEntry } from '@mms/shared';

export interface UserColumnPref {
  key: string;
  enabled: boolean;
  order: number;
}

const storageKey = (userId: string) => `mms_contacts_columns_${userId}`;

export function sanitizeUserColumnPrefs(prefs: any[]): UserColumnPref[] {
  if (!Array.isArray(prefs)) return [];
  return prefs
    .filter((p) => p && typeof p === "object" && typeof p.key === "string" && p.key.trim().length > 0)
    .map((p, index) => {
      const enabled = typeof p.enabled === "boolean"
        ? p.enabled
        : p.enabled === "true" || p.enabled === 1 || p.enabled === "1";
      const raw = typeof p.order === "number" ? p.order : Number(p.order);
      const floored = Math.floor(raw);
      const order = Number.isSafeInteger(floored) && floored >= 0 ? floored : index;
      return { key: p.key.trim(), enabled, order };
    });
}

/** Loads per-user Work directory column layout (globle1 §3.4). */
export function loadUserColumnPrefs(userId: string): UserColumnPref[] | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return sanitizeUserColumnPrefs(parsed);
  } catch {
    return null;
  }
}

export function saveUserColumnPrefs(userId: string, registry: ColumnRegistryEntry[]): void {
  if (!userId) return;
  const prefs: UserColumnPref[] = registry.map(({ key, enabled, order }) => ({
    key,
    enabled,
    order,
  }));
  saveUserColumnPrefList(userId, prefs);
}

export function saveUserColumnPrefList(userId: string, prefs: UserColumnPref[]): void {
  if (!userId) return;
  const sanitized = sanitizeUserColumnPrefs(prefs);
  localStorage.setItem(storageKey(userId), JSON.stringify(sanitized));
}

export function applyUserColumnOverlay(
  registry: ColumnRegistryEntry[],
  prefs: UserColumnPref[] | null,
): ColumnRegistryEntry[] {
  if (!prefs?.length) return registry;
  const map = new Map(prefs.map((p) => [p.key, p]));
  return registry.map((col) => {
    const pref = map.get(col.key);
    if (!pref) return col;
    return {
      ...col,
      enabled: col.fixed ? col.enabled : pref.enabled,
      order: pref.order,
    };
  });
}
