import {
  FACULTY_MODULE_MANIFEST,
  composeFacultySettings,
  normalizeFacultyModulePreferences,
  type FacultyModulePreferences,
  type FacultySettings,
} from '@mms/shared';
import { createModuleSetupConfigHooks } from '@/lib/query/createModuleSetupConfigHooks';
import {
  fetchFacultyPreferences,
  saveFacultyPreferencesAsync,
  setFacultyPreferencesMemory,
} from '@/tenant/features/faculty/hooks/facultySetupConfigApi';

export const FACULTY_PREFERENCES_QUERY_KEY = [
  FACULTY_MODULE_MANIFEST.collectionKey,
  'preferences',
] as const;

const DEFAULT_FACULTY_MODULE_PREFERENCES: FacultyModulePreferences = normalizeFacultyModulePreferences(null);

const setupConfigHooks = createModuleSetupConfigHooks<FacultyModulePreferences>({
  preferencesQueryKey: FACULTY_PREFERENCES_QUERY_KEY,
  fetchPreferences: fetchFacultyPreferences,
  savePreferences: saveFacultyPreferencesAsync,
  setPreferencesMemory: setFacultyPreferencesMemory,
  preferencesPlaceholder: () => DEFAULT_FACULTY_MODULE_PREFERENCES,
});

export const useFacultyPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useFacultyPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed FacultySettings from preferences queries. */
export function useComposedFacultySettings(): FacultySettings {
  const prefsQuery = useFacultyPreferencesQuery();
  return composeFacultySettings(null, prefsQuery.data ?? DEFAULT_FACULTY_MODULE_PREFERENCES);
}

