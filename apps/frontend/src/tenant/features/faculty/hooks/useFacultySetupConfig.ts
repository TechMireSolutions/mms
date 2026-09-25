import {
  FACULTY_MODULE_MANIFEST,
  composeFacultySettings,
  normalizeFacultyModulePreferences,
  type FacultyModulePreferences,
  type FacultySettings,
  normalizeTeacherModulePreferences,
  type TeacherModulePreferences,
} from '@mms/shared';
import { createModuleSetupConfigHooks } from '@/lib/query/createModuleSetupConfigHooks';
import {
  fetchTeacherPreferences,
  saveTeacherPreferencesAsync,
  setTeacherPreferencesMemory,
} from '@/tenant/features/faculty/hooks/facultySetupConfigApi';

export const FACULTY_PREFERENCES_QUERY_KEY = [
  FACULTY_MODULE_MANIFEST.collectionKey,
  'preferences',
] as const;
export const TEACHERS_PREFERENCES_QUERY_KEY = FACULTY_PREFERENCES_QUERY_KEY;

const normalizePrefs = normalizeFacultyModulePreferences || normalizeTeacherModulePreferences;

const setupConfigHooks = createModuleSetupConfigHooks<FacultyModulePreferences | TeacherModulePreferences>({
  preferencesQueryKey: FACULTY_PREFERENCES_QUERY_KEY,
  fetchPreferences: fetchTeacherPreferences,
  savePreferences: saveTeacherPreferencesAsync,
  setPreferencesMemory: setTeacherPreferencesMemory,
  preferencesPlaceholder: () => normalizePrefs(null),
});

export const useFacultyPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useFacultyPreferencesMutation = setupConfigHooks.usePreferencesMutation;

import { useMemo } from 'react';

export const useTeacherPreferencesQuery = useFacultyPreferencesQuery;
export const useTeacherPreferencesMutation = useFacultyPreferencesMutation;

/** Composed FacultySettings from preferences queries. */
export function useComposedFacultySettings(): FacultySettings {
  const prefsQuery = useFacultyPreferencesQuery();
  const fallback = useMemo(() => normalizePrefs(null), []);
  return composeFacultySettings(null, prefsQuery.data ?? fallback);
}
export const useComposedTeachersSettings = useComposedFacultySettings;

