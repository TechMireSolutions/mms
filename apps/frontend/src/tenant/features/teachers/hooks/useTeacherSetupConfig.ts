import {
  TEACHERS_MODULE_MANIFEST,
  normalizeTeacherModulePreferences,
  type TeacherModulePreferences,
  type TeachersSettings
} from '@mms/shared';
import { createModuleSetupConfigHooks } from '@/lib/query/createModuleSetupConfigHooks';
import {
  fetchTeacherPreferences,
  saveTeacherPreferencesAsync,
  setTeacherPreferencesMemory,
} from '@/tenant/features/teachers/hooks/teacherSetupConfigApi';

export const TEACHERS_PREFERENCES_QUERY_KEY = [
  TEACHERS_MODULE_MANIFEST.collectionKey,
  'preferences',
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<TeacherModulePreferences>({
  preferencesQueryKey: TEACHERS_PREFERENCES_QUERY_KEY,
  fetchPreferences: fetchTeacherPreferences,
  savePreferences: saveTeacherPreferencesAsync,
  setPreferencesMemory: setTeacherPreferencesMemory,
  preferencesPlaceholder: () => normalizeTeacherModulePreferences(null),
});

export const useTeacherPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useTeacherPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed TeachersSettings from preferences queries. */
export function useComposedTeachersSettings(): TeachersSettings {
  const prefsQuery = useTeacherPreferencesQuery();
  return (prefsQuery.data ?? normalizeTeacherModulePreferences(null)) as unknown as TeachersSettings;
}
