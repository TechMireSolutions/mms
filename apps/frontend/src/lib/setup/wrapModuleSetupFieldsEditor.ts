import type { FieldDefinition, TabDefinition } from "@mms/shared";
import type { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";

type FieldsEditor = ReturnType<typeof useModuleSettingsEditor>["fieldsEditor"];

/**
 * Wrap a Setup fields editor: restore seed labelKey/descriptionKey and force locked tabs enabled.
 */
export function wrapModuleSetupFieldsEditor({
  fieldsEditor,
  handleDeleteField,
  handleDeleteTab,
  getSeedTab,
  initialFieldSeed,
  isLockedTab,
}: {
  fieldsEditor: FieldsEditor;
  handleDeleteField: FieldsEditor["handleDeleteField"];
  handleDeleteTab: FieldsEditor["handleDeleteTab"];
  getSeedTab: (tabKey: string) => TabDefinition | undefined;
  initialFieldSeed: Record<string, FieldDefinition[]>;
  isLockedTab: (tabKey: string) => boolean;
}) {
  return {
    ...fieldsEditor,
    handleDeleteField,
    handleDeleteTab,
    formTabs: fieldsEditor.formTabs.map((tab) => {
      const seed = getSeedTab(tab.key);
      return {
        ...tab,
        labelKey: tab.labelKey ?? seed?.labelKey,
        enabled: isLockedTab(tab.key) ? true : tab.enabled,
      };
    }),
    tabFields: Object.fromEntries(
      Object.entries(fieldsEditor.tabFields).map(([tabId, list]) => {
        const seedFields = initialFieldSeed[tabId] || [];
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
