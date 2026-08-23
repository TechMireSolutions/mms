/**
 * Teachers Setup field-config + preferences via typed REST.
 */
import {
  composeTeachersSettings,
  normalizeTeacherModulePreferences,
  normalizeTeachersSettings,
  stripTeacherFieldConfigForPersist,
  type TeacherModulePreferences,
  type TeachersSettings,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<TeachersSettings, TeacherModulePreferences>({
    fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.teachers.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.teachers.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.teachers.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.teachers.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
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
