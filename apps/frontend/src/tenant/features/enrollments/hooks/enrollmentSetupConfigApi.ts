/**
 * Setup field-config + preferences via typed REST.
 */
import {
  composeEnrollmentsSettings,
  normalizeEnrollmentModulePreferences,
  normalizeEnrollmentsSettings,
  stripEnrollmentFieldConfigForPersist,
  type EnrollmentModulePreferences,
  type EnrollmentsSettings,
} from "@mms/shared";
import { apiContract } from "@/lib/api";
import { createModuleSetupConfigApi } from "@/lib/query/createModuleSetupConfigApi";

const api = createModuleSetupConfigApi<EnrollmentsSettings, EnrollmentModulePreferences>({
  fetchFieldConfigFn: async (signal) => {
    const res = await apiContract.enrollments.getFieldConfig({ query: undefined, extraHeaders: {} });
    return (res.body as any).config;
  },
  saveFieldConfigFn: async (config) => {
    const res = await apiContract.enrollments.updateFieldConfig({ body: config as any });
    return (res.body as any).config;
  },
  fetchPreferencesFn: async (signal) => {
    const res = await apiContract.enrollments.getPreferences({ query: undefined, extraHeaders: {} });
    return (res.body as any).preferences;
  },
  savePreferencesFn: async (prefs) => {
    const res = await apiContract.enrollments.updatePreferences({ body: prefs as any });
    return (res.body as any).preferences;
  },
  normalizeFieldConfig: normalizeEnrollmentsSettings,
  composeSettings: composeEnrollmentsSettings as any,
  normalizePrefs: normalizeEnrollmentModulePreferences as any,
  stripFieldConfig: stripEnrollmentFieldConfigForPersist as any,
});

export const setEnrollmentFieldConfigMemory = api.setFieldConfigMemory;
export const setEnrollmentPreferencesMemory = api.setPreferencesMemory;
export const fetchEnrollmentFieldConfig = api.fetchFieldConfig;
export const saveEnrollmentFieldConfigAsync = api.saveFieldConfigAsync;
export const fetchEnrollmentPreferences = api.fetchPreferences;
export const saveEnrollmentPreferencesAsync = api.savePreferencesAsync;
export const getEnrollmentSettingsMemoryFallback = api.getSettingsMemoryFallback;
