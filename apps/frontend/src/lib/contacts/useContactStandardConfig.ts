import { createStandardModuleConfigHook } from "@/hooks/createStandardModuleConfigHook";
import { getContactFieldSystemDefaults } from "@/lib/contactFieldsMigration";
import { loadFieldConfig, setFieldConfigMemory } from "@/lib/contactFieldsStore";
import { setPreferencesMemory } from "@/lib/contacts/preferencesStorage";
import {
  CONTACTS_FIELD_CONFIG_QUERY_KEY,
  CONTACTS_PREFERENCES_QUERY_KEY,
  useContactFieldConfigMutation,
  useContactFieldConfigQuery,
  useContactPreferencesMutation,
} from "@/tenant/hooks/collections/contacts";
import type {
  ContactConfigExtras,
  ContactsConfigSettings,
} from "./useContactConfigTypes";
import { useContactsConfigEnhance } from "./useContactsConfigEnhance";

const useContactsConfigImpl = createStandardModuleConfigHook<
  ContactsConfigSettings,
  ContactConfigExtras
>({
  defaultSettings: getContactFieldSystemDefaults(),
  defaultFieldDefs: [],
  useComposedSettings: function useComposedContactsSettings() {
    const fieldConfigQuery = useContactFieldConfigQuery();
    return (fieldConfigQuery.data ?? loadFieldConfig()) as ContactsConfigSettings;
  },
  useFieldConfigMutation: useContactFieldConfigMutation,
  usePreferencesMutation: useContactPreferencesMutation as unknown as () => {
    mutateAsync: (payload: unknown) => Promise<unknown>;
  },
  setFieldConfigMemory,
  setPreferencesMemory: setPreferencesMemory as (prefs: unknown) => void,
  fieldConfigQueryKey: CONTACTS_FIELD_CONFIG_QUERY_KEY,
  preferencesQueryKey: CONTACTS_PREFERENCES_QUERY_KEY,
  normalizeSettings: (settings) =>
    (settings as ContactsConfigSettings | null | undefined) ?? getContactFieldSystemDefaults(),
  normalizePrefs: (prefs) => prefs,
  composeSettings: (settings, _prefs, formTabs) => {
    const config = (settings as ContactsConfigSettings | null | undefined) ?? getContactFieldSystemDefaults();
    return formTabs ? ({ ...config, formTabs } as ContactsConfigSettings) : config;
  },
  // Contacts persists field config and preferences as separate REST documents.
  persistPrefsWithSettings: false,
  useEnhance: useContactsConfigEnhance,
});

export function useContactsConfig() {
  return useContactsConfigImpl();
}

export type ContactsConfigResult = ReturnType<typeof useContactsConfig>;
