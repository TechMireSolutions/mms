import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEFAULT_STUDENTS_SETTINGS,
  STUDENTS_MODULE_MANIFEST,
  composeStudentsSettings,
  normalizeStudentModulePreferences,
  type StudentModulePreferences,
  type StudentsSettings,
} from "@mms/shared";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  fetchStudentFieldConfig,
  fetchStudentPreferences,
  getStudentSettingsMemoryFallback,
  saveStudentFieldConfigAsync,
  saveStudentPreferencesAsync,
  setStudentFieldConfigMemory,
  setStudentPreferencesMemory,
} from "@/tenant/features/students/hooks/studentSetupConfigApi";

export const STUDENTS_FIELD_CONFIG_QUERY_KEY = [
  STUDENTS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const STUDENTS_PREFERENCES_QUERY_KEY = [
  STUDENTS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

export function useStudentFieldConfigQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENTS_FIELD_CONFIG_QUERY_KEY,
    queryFn: ({ signal }) => fetchStudentFieldConfig(signal),
    enabled: isAuthenticated,
    placeholderData: getStudentSettingsMemoryFallback() || DEFAULT_STUDENTS_SETTINGS,
    staleTime: 60_000,
  });
}

export function useStudentFieldConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: StudentsSettings) => saveStudentFieldConfigAsync(config),
    onSuccess: (saved) => {
      setStudentFieldConfigMemory(saved);
      queryClient.setQueryData(STUDENTS_FIELD_CONFIG_QUERY_KEY, saved);
      void queryClient.invalidateQueries({ queryKey: STUDENTS_FIELD_CONFIG_QUERY_KEY });
    },
  });
}

export function useStudentPreferencesQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: STUDENTS_PREFERENCES_QUERY_KEY,
    queryFn: ({ signal }) => fetchStudentPreferences(signal),
    enabled: isAuthenticated,
    placeholderData: normalizeStudentModulePreferences(null),
    staleTime: 60_000,
  });
}

export function useStudentPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: StudentModulePreferences | StudentsSettings) =>
      saveStudentPreferencesAsync(preferences),
    onSuccess: (saved) => {
      setStudentPreferencesMemory(saved);
      queryClient.setQueryData(STUDENTS_PREFERENCES_QUERY_KEY, saved);
      void queryClient.invalidateQueries({ queryKey: STUDENTS_PREFERENCES_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: STUDENTS_FIELD_CONFIG_QUERY_KEY });
    },
  });
}

/** Composed StudentsSettings from typed field-config + preferences queries. */
export function useComposedStudentsSettings(): StudentsSettings {
  const fieldQuery = useStudentFieldConfigQuery();
  const prefsQuery = useStudentPreferencesQuery();
  return composeStudentsSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeStudentModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
