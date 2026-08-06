import {
  STUDENTS_MODULE_MANIFEST,
  splitStudentsSettingsBlob,
  type StudentModulePreferences,
} from '@mms/shared';

/** Legacy document-store Students Setup object keys. */
export const STUDENTS_SETTINGS_OBJECT_KEY = STUDENTS_MODULE_MANIFEST.settingsObjectKey;
export const STUDENTS_COLUMN_PREFS_OBJECT_KEY = STUDENTS_MODULE_MANIFEST.columnPreferencesObjectKey;

export const STUDENTS_FIELD_CONFIG_COLLECTION = 'student_field_configs';
export const STUDENTS_MODULE_PREFS_COLLECTION = 'student_module_preferences';
export const STUDENTS_COLUMN_PREFS_COLLECTION = 'student_user_column_prefs';

/** Legacy Students Setup object keys that must not re-enter the document store after typed hydrate. */
export const STUDENTS_LEGACY_SETUP_OBJECT_KEYS = [
  STUDENTS_SETTINGS_OBJECT_KEY,
  STUDENTS_COLUMN_PREFS_OBJECT_KEY,
] as const;

function isEmptyCollection(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

/**
 * When a full backup only carries legacy `students_settings` / column-prefs objects,
 * populate typed Setup collection arrays so restore does not wipe FORCE-RLS tables empty.
 */
export function hydrateStudentsSetupCollectionsFromLegacyObjects(
  collections: Record<string, unknown[]>,
  objects: Record<string, unknown> | undefined,
): Record<string, unknown[]> {
  if (!Array.isArray(collections.users) || !objects) return collections;

  const next: Record<string, unknown[]> = { ...collections };

  if (
    isEmptyCollection(next[STUDENTS_FIELD_CONFIG_COLLECTION]) ||
    isEmptyCollection(next[STUDENTS_MODULE_PREFS_COLLECTION])
  ) {
    const legacySettings = objects[STUDENTS_SETTINGS_OBJECT_KEY];
    if (legacySettings && typeof legacySettings === 'object' && !Array.isArray(legacySettings)) {
      const { fieldConfig, preferences } = splitStudentsSettingsBlob(legacySettings);
      if (isEmptyCollection(next[STUDENTS_FIELD_CONFIG_COLLECTION])) {
        next[STUDENTS_FIELD_CONFIG_COLLECTION] = [{ config: fieldConfig }];
      }
      if (isEmptyCollection(next[STUDENTS_MODULE_PREFS_COLLECTION])) {
        const prefsRow: { preferences: StudentModulePreferences } = { preferences };
        next[STUDENTS_MODULE_PREFS_COLLECTION] = [prefsRow];
      }
    }
  }

  if (isEmptyCollection(next[STUDENTS_COLUMN_PREFS_COLLECTION])) {
    const legacyColumn = objects[STUDENTS_COLUMN_PREFS_OBJECT_KEY];
    if (legacyColumn && typeof legacyColumn === 'object' && !Array.isArray(legacyColumn)) {
      const rows: Array<Record<string, unknown>> = [];
      for (const [userId, preferences] of Object.entries(legacyColumn as Record<string, unknown>)) {
        if (!userId.trim() || !Array.isArray(preferences)) continue;
        rows.push({ userId, preferences });
      }
      if (rows.length > 0) {
        next[STUDENTS_COLUMN_PREFS_COLLECTION] = rows;
      }
    }
  }

  return next;
}
