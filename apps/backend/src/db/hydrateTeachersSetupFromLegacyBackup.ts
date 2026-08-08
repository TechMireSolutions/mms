import {
  TEACHERS_MODULE_MANIFEST,
  splitTeachersSettingsBlob,
  type TeacherModulePreferences,
} from '@mms/shared';

/** Legacy document-store Teachers Setup object keys. */
export const TEACHERS_SETTINGS_OBJECT_KEY = TEACHERS_MODULE_MANIFEST.settingsObjectKey;
export const TEACHERS_COLUMN_PREFS_OBJECT_KEY = TEACHERS_MODULE_MANIFEST.columnPreferencesObjectKey;

export const TEACHERS_FIELD_CONFIG_COLLECTION = 'teacher_field_configs';
export const TEACHERS_MODULE_PREFS_COLLECTION = 'teacher_module_preferences';
export const TEACHERS_COLUMN_PREFS_COLLECTION = 'teacher_user_column_prefs';

/** Legacy Teachers Setup object keys that must not re-enter the document store after typed hydrate. */
export const TEACHERS_LEGACY_SETUP_OBJECT_KEYS = [
  TEACHERS_SETTINGS_OBJECT_KEY,
  TEACHERS_COLUMN_PREFS_OBJECT_KEY,
] as const;

function isEmptyCollection(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

/**
 * When a full backup only carries legacy `teachers_settings` / column-prefs objects,
 * populate typed Setup collection arrays so restore does not wipe FORCE-RLS tables empty.
 */
export function hydrateTeachersSetupCollectionsFromLegacyObjects(
  collections: Record<string, unknown[]>,
  objects: Record<string, unknown> | undefined,
): Record<string, unknown[]> {
  if (!Array.isArray(collections.users) || !objects) return collections;

  const next: Record<string, unknown[]> = { ...collections };

  if (
    isEmptyCollection(next[TEACHERS_FIELD_CONFIG_COLLECTION]) ||
    isEmptyCollection(next[TEACHERS_MODULE_PREFS_COLLECTION])
  ) {
    const legacySettings = objects[TEACHERS_SETTINGS_OBJECT_KEY];
    if (legacySettings && typeof legacySettings === 'object' && !Array.isArray(legacySettings)) {
      const { fieldConfig, preferences } = splitTeachersSettingsBlob(legacySettings);
      if (isEmptyCollection(next[TEACHERS_FIELD_CONFIG_COLLECTION])) {
        next[TEACHERS_FIELD_CONFIG_COLLECTION] = [{ config: fieldConfig }];
      }
      if (isEmptyCollection(next[TEACHERS_MODULE_PREFS_COLLECTION])) {
        const prefsRow: { preferences: TeacherModulePreferences } = { preferences };
        next[TEACHERS_MODULE_PREFS_COLLECTION] = [prefsRow];
      }
    }
  }

  if (isEmptyCollection(next[TEACHERS_COLUMN_PREFS_COLLECTION])) {
    const legacyColumn = objects[TEACHERS_COLUMN_PREFS_OBJECT_KEY];
    if (legacyColumn && typeof legacyColumn === 'object' && !Array.isArray(legacyColumn)) {
      const rows: Array<Record<string, unknown>> = [];
      for (const [userId, preferences] of Object.entries(legacyColumn as Record<string, unknown>)) {
        if (!userId.trim() || !Array.isArray(preferences)) continue;
        rows.push({ userId, preferences });
      }
      if (rows.length > 0) {
        next[TEACHERS_COLUMN_PREFS_COLLECTION] = rows;
      }
    }
  }

  return next;
}
