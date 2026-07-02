import type { ColumnRegistryEntry, ContactColumnPreference } from '@mms/shared';

const buildContactColumnPreferencesStorageKey = (userId: string) => `mms_contacts_columns_${userId}`;

export function sanitizeUserColumnPreferences(preferences: unknown[]): ContactColumnPreference[] {
  if (!Array.isArray(preferences)) return [];
  return preferences
    .filter((columnPreference): columnPreference is Record<string, unknown> => {
      return (
        columnPreference !== null &&
        typeof columnPreference === "object" &&
        "key" in columnPreference &&
        typeof columnPreference.key === "string" &&
        columnPreference.key.trim().length > 0
      );
    })
    .map((columnPreference, index) => {
      const enabled = typeof columnPreference.enabled === "boolean"
        ? columnPreference.enabled
        : columnPreference.enabled === "true" || columnPreference.enabled === 1 || columnPreference.enabled === "1";
      const raw = typeof columnPreference.order === "number" ? columnPreference.order : Number(columnPreference.order);
      const floored = Math.floor(raw);
      const order = Number.isSafeInteger(floored) && floored >= 0 ? floored : index;
      return { key: (columnPreference.key as string).trim(), enabled, order };
    });
}

/** Loads per-user Work directory column layout. */
export function loadUserColumnPreferences(userId: string): ContactColumnPreference[] | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(buildContactColumnPreferencesStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return sanitizeUserColumnPreferences(parsed);
  } catch {
    return null;
  }
}

export function saveUserColumnPreferences(userId: string, registry: ColumnRegistryEntry[]): void {
  if (!userId) return;
  const preferences: ContactColumnPreference[] = registry.map(({ key, enabled, order }) => ({
    key,
    enabled,
    order,
  }));
  saveUserColumnPreferenceList(userId, preferences);
}

export function saveUserColumnPreferenceList(userId: string, preferences: ContactColumnPreference[]): void {
  if (!userId) return;
  const sanitized = sanitizeUserColumnPreferences(preferences);
  localStorage.setItem(buildContactColumnPreferencesStorageKey(userId), JSON.stringify(sanitized));
}

export function applyUserColumnOverlay(
  registry: ColumnRegistryEntry[],
  preferences: ContactColumnPreference[] | null,
): ColumnRegistryEntry[] {
  if (!preferences?.length) return registry;
  const preferenceByColumnKey = new Map(preferences.map((columnPreference) => [columnPreference.key, columnPreference]));
  return registry.map((column) => {
    const columnPreference = preferenceByColumnKey.get(column.key);
    if (!columnPreference) return column;
    return {
      ...column,
      enabled: column.fixed ? column.enabled : columnPreference.enabled,
      order: columnPreference.order,
    };
  });
}
