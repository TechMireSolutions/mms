import {
  type ContactPreferences,
  getContactSeedFormTab,
  INITIAL_FIELD_SEED,
  isContactLockedEnabledTab,
} from "@mms/shared";
import type { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";

type FieldsEditor = ReturnType<typeof useModuleSettingsEditor>["fieldsEditor"];

export function wrapContactsSetupFieldsEditor({
  fieldsEditor,
  handleDeleteField,
  handleDeleteTab,
}: {
  fieldsEditor: FieldsEditor;
  handleDeleteField: FieldsEditor["handleDeleteField"];
  handleDeleteTab: FieldsEditor["handleDeleteTab"];
}) {
  return {
    ...fieldsEditor,
    handleDeleteField,
    handleDeleteTab,
    formTabs: fieldsEditor.formTabs.map((tab) => {
      const seed = getContactSeedFormTab(tab.key);
      return {
        ...tab,
        labelKey: tab.labelKey ?? seed?.labelKey,
        enabled: isContactLockedEnabledTab(tab.key) ? true : tab.enabled,
      };
    }),
    tabFields: Object.fromEntries(
      Object.entries(fieldsEditor.tabFields).map(([tabId, list]) => {
        const seedFields = INITIAL_FIELD_SEED[tabId] || [];
        const seedByKey = new Map(seedFields.map((field) => [field.key, field]));
        return [
          tabId,
          list.map((field) => ({
            ...field,
            labelKey: field.labelKey ?? seedByKey.get(field.key)?.labelKey,
            descriptionKey: field.descriptionKey ?? seedByKey.get(field.key)?.descriptionKey,
          })),
        ];
      }),
    ),
  };
}

export function buildCountrySelectOptions(
  countryCodesDraft: Array<{ country: string; code: string }>,
  formatDialCode: (code: string) => string,
): Array<{ value: string; label: string }> {
  return (countryCodesDraft || []).map((countryCodeObj) => {
    const formattedCode = formatDialCode(countryCodeObj.code || "");
    return {
      value: countryCodeObj.country,
      label: formattedCode
        ? `${countryCodeObj.country} (${formattedCode})`
        : countryCodeObj.country,
    };
  });
}

export type ContactsSetupPrefsDraft = {
  prefs: ContactPreferences;
  countryCodesDraft: Array<{ country: string; code: string }>;
};
