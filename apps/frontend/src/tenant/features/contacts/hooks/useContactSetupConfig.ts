import type { ContactPreferences, FieldConfig } from "@mms/shared";
import { CONTACTS_MODULE_MANIFEST, DEFAULT_CONTACT_PREFERENCES } from "@mms/shared";
import {
  fetchFieldConfig,
  saveFieldConfigAsync,
  setFieldConfigMemory,
} from "@/lib/contactFieldsStore";
import {
  fetchPreferences,
  savePreferencesAsync,
  setPreferencesMemory,
} from "@/lib/contacts/preferencesStorage";
import { getContactFieldSystemDefaults } from "@/lib/contactFieldsMigration";
import { createModuleSetupConfigHooks } from "@/lib/query/createModuleSetupConfigHooks";

export const CONTACTS_FIELD_CONFIG_QUERY_KEY = [
  CONTACTS_MODULE_MANIFEST.collectionKey,
  "field-config",
] as const;

export const CONTACTS_PREFERENCES_QUERY_KEY = [
  CONTACTS_MODULE_MANIFEST.collectionKey,
  "preferences",
] as const;

const setupConfigHooks = createModuleSetupConfigHooks<FieldConfig, ContactPreferences>({
  fieldConfigQueryKey: CONTACTS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: CONTACTS_PREFERENCES_QUERY_KEY,
  fetchFieldConfig,
  saveFieldConfig: saveFieldConfigAsync,
  setFieldConfigMemory,
  fieldConfigPlaceholder: getContactFieldSystemDefaults,
  fetchPreferences,
  savePreferences: savePreferencesAsync,
  setPreferencesMemory,
  preferencesPlaceholder: DEFAULT_CONTACT_PREFERENCES,
});

export const useContactFieldConfigQuery = setupConfigHooks.useFieldConfigQuery;
export const useContactFieldConfigMutation = setupConfigHooks.useFieldConfigMutation;
export const useContactPreferencesQuery = setupConfigHooks.usePreferencesQuery;
export const useContactPreferencesMutation = setupConfigHooks.usePreferencesMutation;
