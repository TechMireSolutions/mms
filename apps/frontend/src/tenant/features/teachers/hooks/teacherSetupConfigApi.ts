/**
 * Teachers Setup field-config + preferences via typed REST.
 */
import {
  TEACHERS_MODULE_MANIFEST,
  composeTeachersSettings,
  normalizeTeacherModulePreferences,
  normalizeTeachersSettings,
  stripTeacherFieldConfigForPersist,
  type TeacherModulePreferences,
  type TeachersSettings,
} from "@mms/shared";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<TeachersSettings, TeacherModulePreferences>({
  restBasePath: TEACHERS_MODULE_MANIFEST.restBasePath,
  normalizeFieldConfig: normalizeTeachersSettings,
  composeSettings: composeTeachersSettings as (
    fieldConfig: unknown,
    preferences: unknown,
    formTabs?: unknown[],
  ) => TeachersSettings,
  normalizePrefs: normalizeTeacherModulePreferences as (prefs: unknown) => TeacherModulePreferences,
  stripFieldConfig: stripTeacherFieldConfigForPersist,
});

export const setTeacherFieldConfigMemory = api.setFieldConfigMemory;
export const setTeacherPreferencesMemory = api.setPreferencesMemory;
export const fetchTeacherFieldConfig = api.fetchFieldConfig;
export const saveTeacherFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchTeacherPreferences = api.fetchPreferences;
export const saveTeacherPreferencesAsync = api.savePreferencesAsync;
export const getTeacherSettingsMemoryFallback = api.getSettingsMemoryFallback;
