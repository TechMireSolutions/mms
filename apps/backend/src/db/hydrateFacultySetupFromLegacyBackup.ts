import { TEACHERS_MODULE_MANIFEST, splitTeachersSettingsBlob } from '@mms/shared';
import {
  hydrateModuleSetupCollectionsFromLegacyObjects,
  type LegacySetupHydrateConfig,
} from './hydrateModuleSetupFromLegacyBackup.js';

/** Legacy document-store Teachers Setup object keys (used to build the strip list below). */
const TEACHERS_SETTINGS_OBJECT_KEY = TEACHERS_MODULE_MANIFEST.settingsObjectKey;
const TEACHERS_COLUMN_PREFS_OBJECT_KEY = TEACHERS_MODULE_MANIFEST.columnPreferencesObjectKey;

/** Legacy Teachers Setup object keys that must not re-enter the document store after typed hydrate. */
export const TEACHERS_LEGACY_SETUP_OBJECT_KEYS = [
  TEACHERS_SETTINGS_OBJECT_KEY,
  TEACHERS_COLUMN_PREFS_OBJECT_KEY,
] as const;

const TEACHERS_HYDRATE_CONFIG: LegacySetupHydrateConfig = {
  settingsObjectKey: TEACHERS_SETTINGS_OBJECT_KEY,
  columnPreferencesObjectKey: TEACHERS_COLUMN_PREFS_OBJECT_KEY,
  fieldConfigCollection: 'teacher_field_configs',
  modulePrefsCollection: 'teacher_module_preferences',
  columnPrefsCollection: 'teacher_user_column_prefs',
  splitSettingsBlob: splitTeachersSettingsBlob,
};

/**
 * When a full backup only carries legacy `teachers_settings` / column-prefs objects,
 * populate typed Setup collection arrays so restore does not wipe FORCE-RLS tables empty.
 */
export function hydrateTeachersSetupCollectionsFromLegacyObjects(
  collections: Record<string, unknown[]>,
  objects: Record<string, unknown> | undefined,
): Record<string, unknown[]> {
  return hydrateModuleSetupCollectionsFromLegacyObjects(collections, objects, TEACHERS_HYDRATE_CONFIG);
}