import {
  FACULTY_MODULE_MANIFEST,
  splitFacultySettingsBlob,
} from '@mms/shared';
import {
  hydrateModuleSetupCollectionsFromLegacyObjects,
  type LegacySetupHydrateConfig,
} from './hydrateModuleSetupFromLegacyBackup.js';

/** Canonical document-store Faculty Setup object keys. */
export const FACULTY_SETTINGS_OBJECT_KEY = FACULTY_MODULE_MANIFEST.settingsObjectKey;
export const FACULTY_COLUMN_PREFS_OBJECT_KEY = FACULTY_MODULE_MANIFEST.columnPreferencesObjectKey;

/** Historical fallback document-store keys from pre-faculty schema. */
export const FACULTY_FALLBACK_SETTINGS_OBJECT_KEY = 'teachers_settings';
export const FACULTY_FALLBACK_COLUMN_PREFS_OBJECT_KEY = 'teacher_user_column_preferences';
export const FACULTY_FALLBACK_CONFIG_OBJECT_KEY = 'teacher_field_config';

/** Legacy Faculty Setup object keys that must not re-enter the document store after typed hydrate. */
export const FACULTY_LEGACY_SETUP_OBJECT_KEYS = [
  FACULTY_SETTINGS_OBJECT_KEY,
  FACULTY_COLUMN_PREFS_OBJECT_KEY,
  FACULTY_FALLBACK_SETTINGS_OBJECT_KEY,
  FACULTY_FALLBACK_COLUMN_PREFS_OBJECT_KEY,
  FACULTY_FALLBACK_CONFIG_OBJECT_KEY,
  'faculty_field_config',
] as const;

/** Historical collection aliases mapped to canonical faculty collections during restore. */
export const LEGACY_FACULTY_COLLECTION_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ['teachers', 'faculty'],
  ['teacher_field_configs', 'faculty_field_configs'],
  ['teacher_module_preferences', 'faculty_module_preferences'],
  ['teacher_user_column_prefs', 'faculty_user_column_prefs'],
  ['teacher_lookups', 'faculty_lookups'],
] as const;

/**
 * When a full backup carries legacy `faculty_settings` or historical `teachers_settings` objects,
 * populates typed Setup collection arrays so restore does not wipe FORCE-RLS tables empty.
 * Converts all legacy teacher collection names to canonical faculty collections.
 *
 * @param {Record<string, unknown[]>} collections - Raw backup collection maps.
 * @param {Record<string, unknown> | undefined} objects - Raw backup key-value object store.
 * @returns {Record<string, unknown[]>} Normalized collections containing typed faculty records.
 */
export function hydrateFacultySetupCollectionsFromLegacyObjects(
  collections: Record<string, unknown[]>,
  objects: Record<string, unknown> | undefined,
): Record<string, unknown[]> {
  if (!Array.isArray(collections.users) || !objects) return collections;

  const next: Record<string, unknown[]> = { ...collections };

  // Forward-migrate and normalize legacy collection aliases to canonical faculty collections
  for (const [legacyKey, canonicalKey] of LEGACY_FACULTY_COLLECTION_ALIASES) {
    if (next[legacyKey] && !next[canonicalKey]) {
      next[canonicalKey] = next[legacyKey];
    }
    delete next[legacyKey];
  }

  const hasModernSettings = Boolean(objects && objects[FACULTY_SETTINGS_OBJECT_KEY]);
  const hasModernColumnPrefs = Boolean(objects && objects[FACULTY_COLUMN_PREFS_OBJECT_KEY]);

  const config: LegacySetupHydrateConfig = {
    settingsObjectKey: hasModernSettings
      ? FACULTY_SETTINGS_OBJECT_KEY
      : FACULTY_FALLBACK_SETTINGS_OBJECT_KEY,
    columnPreferencesObjectKey: hasModernColumnPrefs
      ? FACULTY_COLUMN_PREFS_OBJECT_KEY
      : FACULTY_FALLBACK_COLUMN_PREFS_OBJECT_KEY,
    fieldConfigCollection: 'faculty_field_configs',
    modulePrefsCollection: 'faculty_module_preferences',
    columnPrefsCollection: 'faculty_user_column_prefs',
    splitSettingsBlob: splitFacultySettingsBlob,
  };

  return hydrateModuleSetupCollectionsFromLegacyObjects(next, objects, config);
}
