import {
  DEFAULT_USERS_SETTINGS,
  USERS_MODULE_MANIFEST,
  composeUsersSettings,
  normalizeUserModulePreferences,
  type UserModulePreferences,
  type UsersSettings,
} from "@mms/shared";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";
import {
  fetchUserFieldConfig,
  fetchUserPreferences,
  getUserSettingsMemoryFallback,
  saveUserFieldConfigAsync,
  saveUserPreferencesAsync,
  setUserFieldConfigMemory,
  setUserPreferencesMemory,
} from "@/tenant/features/users/hooks/userSetupConfigApi";

export const USERS_FIELD_CONFIG_QUERY_KEY = [
  USERS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const USERS_PREFERENCES_QUERY_KEY = [
  USERS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<
  UsersSettings,
  UserModulePreferences,
  UserModulePreferences | UsersSettings
>({
  fieldConfigQueryKey: USERS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: USERS_PREFERENCES_QUERY_KEY,
  fetchFieldConfig: fetchUserFieldConfig,
  saveFieldConfig: saveUserFieldConfigAsync,
  setFieldConfigMemory: setUserFieldConfigMemory,
  fieldConfigPlaceholder: () => getUserSettingsMemoryFallback() || DEFAULT_USERS_SETTINGS,
  fetchPreferences: fetchUserPreferences,
  savePreferences: saveUserPreferencesAsync,
  setPreferencesMemory: setUserPreferencesMemory,
  preferencesPlaceholder: () => normalizeUserModulePreferences(null),
  invalidateFieldConfigOnPreferencesSave: true,
});

export const useUserFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useUserFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useUserPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useUserPreferencesMutation = setupConfigHooks.usePreferencesMutation;

/** Composed UsersSettings from typed field-config + preferences queries. */
export function useComposedUsersSettings(): UsersSettings {
  const fieldQuery = useUserFieldConfigQuery();
  const prefsQuery = useUserPreferencesQuery();
  return composeUsersSettings(
    fieldQuery.data,
    prefsQuery.data ?? normalizeUserModulePreferences(null),
    fieldQuery.data?.formTabs,
  );
}
