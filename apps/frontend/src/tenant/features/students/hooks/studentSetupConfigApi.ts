/**
 * Students Setup field-config + preferences via typed REST.
 */
import {
  composeStudentsSettings,
  normalizeStudentModulePreferences,
  normalizeStudentsSettings,
  stripStudentFieldConfigForPersist,
  type StudentModulePreferences,
  type StudentsSettings,
} from "@mms/shared";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";
import { apiContract } from "@/lib/api";

const api = createModuleSetupConfigApi<StudentsSettings, StudentModulePreferences>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.students.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.students.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.students.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.students.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
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
