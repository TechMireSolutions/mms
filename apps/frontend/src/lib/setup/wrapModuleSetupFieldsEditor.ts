import type { FieldDefinition, TabDefinition } from "@mms/shared";
import type { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { safeArray } from "@/tenant/hooks/moduleFieldsEditorUtils";

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
  const formTabs = safeArray<TabDefinition>(fieldsEditor?.formTabs);
  const tabFieldsMap = fieldsEditor?.tabFields || {};

  return {
    ...fieldsEditor,
    handleDeleteField,
    handleDeleteTab,
    formTabs: formTabs.map((tab) => {
      const seed = getSeedTab(tab.key);
      return {
        ...tab,
        labelKey: tab.labelKey ?? seed?.labelKey,
        enabled: isLockedTab(tab.key) ? true : tab.enabled,
      };
    }),
    tabFields: Object.fromEntries(
      Object.entries(tabFieldsMap).map(([tabId, list]) => {
        const seedFields = safeArray<FieldDefinition>(initialFieldSeed?.[tabId]);
        const seedByKey = new Map(seedFields.map((field) => [field.key, field]));
        return [
          tabId,
          safeArray<FieldDefinition>(list).map((field) => ({
            ...field,
            labelKey: field.labelKey ?? seedByKey.get(field.key)?.labelKey,
            descriptionKey: field.descriptionKey ?? seedByKey.get(field.key)?.descriptionKey,
          })),
        ];
      }),
    ),
  };
}
