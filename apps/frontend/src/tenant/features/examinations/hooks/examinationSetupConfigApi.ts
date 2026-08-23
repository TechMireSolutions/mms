/**
 * Setup field-config + preferences via typed REST.
 */
import {
  composeExaminationsSettings,
  normalizeExaminationsModulePreferences,
  normalizeExaminationsSettings,
  stripExaminationsFieldConfigForPersist,
  type ExaminationsModulePreferences,
  type ExaminationsSettings,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<ExaminationsSettings, ExaminationsModulePreferences>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.examinations.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.examinations.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.examinations.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.examinations.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizeFieldConfig: normalizeExaminationsSettings,
  composeSettings: composeExaminationsSettings as any,
  normalizePrefs: normalizeExaminationsModulePreferences as any,
  stripFieldConfig: stripExaminationsFieldConfigForPersist as any,
});

export const setExaminationFieldConfigMemory = api.setFieldConfigMemory;
export const setExaminationPreferencesMemory = api.setPreferencesMemory;
export const fetchExaminationFieldConfig = api.fetchFieldConfig;
export const saveExaminationFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchExaminationPreferences = api.fetchPreferences;
export const saveExaminationPreferencesAsync = api.savePreferencesAsync;
export const getExaminationSettingsMemoryFallback = api.getSettingsMemoryFallback;
