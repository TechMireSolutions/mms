/**
 * Students Setup field-config + preferences via typed REST.
 */
import {
  STUDENTS_MODULE_MANIFEST,
  composeStudentsSettings,
  normalizeStudentModulePreferences,
  normalizeStudentsSettings,
  stripStudentFieldConfigForPersist,
  type StudentModulePreferences,
  type StudentsSettings,
} from "@mms/shared";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<StudentsSettings, StudentModulePreferences>({
  restBasePath: STUDENTS_MODULE_MANIFEST.restBasePath,
  normalizeFieldConfig: normalizeStudentsSettings,
  composeSettings: composeStudentsSettings as (
    fieldConfig: unknown,
    preferences: unknown,
    formTabs?: unknown[],
  ) => StudentsSettings,
  normalizePrefs: normalizeStudentModulePreferences as (prefs: unknown) => StudentModulePreferences,
  stripFieldConfig: stripStudentFieldConfigForPersist,
});

export const setStudentFieldConfigMemory = api.setFieldConfigMemory;
export const setStudentPreferencesMemory = api.setPreferencesMemory;
export const fetchStudentFieldConfig = api.fetchFieldConfig;
export const saveStudentFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchStudentPreferences = api.fetchPreferences;
export const saveStudentPreferencesAsync = api.savePreferencesAsync;
export const getStudentSettingsMemoryFallback = api.getSettingsMemoryFallback;
