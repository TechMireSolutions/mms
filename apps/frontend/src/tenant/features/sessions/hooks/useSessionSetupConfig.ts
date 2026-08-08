import {
  DEFAULT_SESSIONS_SETTINGS,
  SESSIONS_MODULE_MANIFEST,
  composeSessionsSettings,
  normalizeSessionModulePreferences,
  type SessionModulePreferences,
  type SessionsSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchSessionFieldConfig,
  fetchSessionPreferences,
  getSessionSettingsMemoryFallback,
  saveSessionFieldConfigAsync,
  saveSessionPreferencesAsync,
  setSessionFieldConfigMemory,
  setSessionPreferencesMemory,
} from "@/tenant/features/sessions/hooks/sessionSetupConfigApi";

export const SESSIONS_FIELD_CONFIG_QUERY_KEY = [
  SESSIONS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const SESSIONS_PREFERENCES_QUERY_KEY = [
  SESSIONS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  SessionsSettings,
  SessionModulePreferences,
  SessionModulePreferences | SessionsSettings
>({
  fieldConfigQueryKey: SESSIONS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: SESSIONS_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchSessionFieldConfig,
  saveFieldConfig: saveSessionFieldConfigAsync,
  setFieldConfigMemory: setSessionFieldConfigMemory,
  fieldConfigPlaceholder: () => getSessionSettingsMemoryFallback() || DEFAULT_SESSIONS_SETTINGS,
  fetchPreferences: fetchSessionPreferences,
  savePreferences: saveSessionPreferencesAsync,
  setPreferencesMemory: setSessionPreferencesMemory,
  preferencesPlaceholder: () => normalizeSessionModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useSessionFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useSessionFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useSessionPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useSessionPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed SessionsSettings from typed field-config + preferences queries. */
export function useComposedSessionsSettings(): SessionsSettings {
  const fieldQuery = useSessionFieldConfigQuery();
  const prefsQuery = useSessionPreferencesQuery();
  return composeSessionsSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeSessionModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
