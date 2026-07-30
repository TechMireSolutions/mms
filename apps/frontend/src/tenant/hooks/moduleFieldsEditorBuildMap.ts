import { type FieldDefinition, type TabDefinition } from "@mms/shared";
import { safeArray } from "./moduleFieldsEditorUtils";

export function buildFieldsMap(
  formTabs: TabDefinition[],
  tabFields: Record<string, FieldDefinition[]>,
  tabFieldEnabled: Record<string, Set<string>>,
  tabFieldRequired: Record<string, Set<string>>,
  tabFieldUnique: Record<string, Set<string>>,
  tabFieldOrder: Record<string, string[]>,
  tabFieldDefaultValues: Record<string, Record<string, unknown>>,
  tabFieldPermissions: Record<string, Record<string, string[]>>,
): Record<string, FieldDefinition[]> {
  const newFields: Record<string, FieldDefinition[]> = {};
  formTabs.forEach((tab) => {
    const tabId = tab.key;
    const combined = safeArray<FieldDefinition>(tabFields[tabId]).map((field) => {
      const fieldKey = field.key || (field as { id?: string }).id || "";
      const enabled = tabFieldEnabled[tabId]?.has(fieldKey) ?? field.enabled ?? false;
      const required = tabFieldRequired[tabId]?.has(fieldKey) ?? field.required ?? false;
      const unique = tabFieldUnique[tabId]?.has(fieldKey) ?? field.unique ?? false;
      const orderArray = tabFieldOrder[tabId] || [];
      const orderIdx = orderArray.indexOf(fieldKey);
      const order = orderIdx >= 0 ? orderIdx : field.order ?? 999;
      const defaultValue = tabFieldDefaultValues[tabId]?.[fieldKey] ?? field.defaultValue;
      const permissions = tabFieldPermissions[tabId]?.[fieldKey] ?? field.permissions;

      return {
        ...field,
        key: fieldKey,
        enabled,
        required,
        order,
        defaultValue,
        permissions,
        unique,
      } as FieldDefinition;
    });

    newFields[tabId] = combined.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  });
  return newFields;
}
