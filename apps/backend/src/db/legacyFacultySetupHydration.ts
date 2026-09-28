import {
  FACULTY_MODULE_MANIFEST,
  splitFacultySettingsBlob,
  TEACHERS_MODULE_MANIFEST,
  splitTeachersSettingsBlob,
} from '@mms/shared';
import {
  hydrateModuleSetupCollectionsFromLegacyObjects,
  type LegacySetupHydrateConfig,
} from './hydrateModuleSetupFromLegacyBackup.js';

/** Legacy document-store Faculty / Teachers Setup object keys. */
const FACULTY_SETTINGS_OBJECT_KEY = FACULTY_MODULE_MANIFEST.settingsObjectKey;
const FACULTY_COLUMN_PREFS_OBJECT_KEY = FACULTY_MODULE_MANIFEST.columnPreferencesObjectKey;
const TEACHERS_SETTINGS_OBJECT_KEY = TEACHERS_MODULE_MANIFEST.settingsObjectKey;
const TEACHERS_COLUMN_PREFS_OBJECT_KEY = TEACHERS_MODULE_MANIFEST.columnPreferencesObjectKey;

/** Legacy Faculty Setup object keys that must not re-enter the document store after typed hydrate. */
export const FACULTY_LEGACY_SETUP_OBJECT_KEYS = [
  FACULTY_SETTINGS_OBJECT_KEY,
  FACULTY_COLUMN_PREFS_OBJECT_KEY,
  TEACHERS_SETTINGS_OBJECT_KEY,
  TEACHERS_COLUMN_PREFS_OBJECT_KEY,
] as const;

/**
 * When a full backup only carries legacy `faculty_settings` / `teachers_settings` objects,
 * populate typed Setup collection arrays so restore does not wipe FORCE-RLS tables empty.
 */
export function hydrateFacultySetupCollectionsFromLegacyObjects(
  collections: Record<string, unknown[]>,
  objects: Record<string, unknown> | undefined,
): Record<string, unknown[]> {
  const hasModernSettings = Boolean(objects && objects[FACULTY_SETTINGS_OBJECT_KEY]);
  const hasModernColumnPrefs = Boolean(objects && objects[FACULTY_COLUMN_PREFS_OBJECT_KEY]);

  const config: LegacySetupHydrateConfig = {
    settingsObjectKey: hasModernSettings ? FACULTY_SETTINGS_OBJECT_KEY : TEACHERS_SETTINGS_OBJECT_KEY,
    columnPreferencesObjectKey: hasModernColumnPrefs
      ? FACULTY_COLUMN_PREFS_OBJECT_KEY
      : TEACHERS_COLUMN_PREFS_OBJECT_KEY,
    fieldConfigCollection: 'faculty_field_configs',
    modulePrefsCollection: 'faculty_module_preferences',
    columnPrefsCollection: 'faculty_user_column_prefs',
    splitSettingsBlob: splitFacultySettingsBlob || splitTeachersSettingsBlob,
  };

  const result = hydrateModuleSetupCollectionsFromLegacyObjects(collections, objects, config);
  const next = { ...result };
  if (next.faculty_field_configs && !next.teacher_field_configs) {
    next.teacher_field_configs = next.faculty_field_configs;
  }
  if (next.faculty_module_preferences && !next.teacher_module_preferences) {
    next.teacher_module_preferences = next.faculty_module_preferences;
  }
  if (next.faculty_user_column_prefs && !next.teacher_user_column_prefs) {
    next.teacher_user_column_prefs = next.faculty_user_column_prefs;
  }
  return next;
}