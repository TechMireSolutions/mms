import { type FieldDefinition, type TabDefinition } from "@mms/shared";

export interface UseFieldsEditorResult {
  formTabs: TabDefinition[];
  tabFields: Record<string, FieldDefinition[]>;
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFieldEnabled: Record<string, Set<string>>;
  tabFieldRequired: Record<string, Set<string>>;
  tabFieldUnique: Record<string, Set<string>>;
  tabFieldDefaultValues: Record<string, Record<string, unknown>>;
  tabFieldPermissions: Record<string, Record<string, string[]>>;
  tabFieldOrder: Record<string, string[]>;

  toggleTabEnabled: (tabId: string) => void;
  toggleTabRequired: (tabId: string) => void;
  toggleFieldEnabled: (tabId: string, fieldId: string) => void;
  toggleFieldRequired: (tabId: string, fieldId: string) => void;
  toggleFieldUnique: (tabId: string, fieldId: string) => void;
  handleReorder: (tabId: string, reorderedFields: FieldDefinition[]) => void;
  handleCustomFieldsChange: (tabId: string, newFields: import("@/components/ui/CustomFieldsBuilder").CustomFieldConfig[]) => void;
  handleEditField: (tabId: string, updatedField: FieldDefinition) => void;
  handleDeleteField: (tabId: string, fieldId: string) => void;
  handleAddTab: (label: string) => void;
  handleDeleteTab: (key: string) => void;
  handleRenameTab: (key: string, newLabel: string) => void;
}

export function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const orderByKey = Object.fromEntries(savedOrder.map((key, index) => [key, index]));
  return [...fields].sort(
    (leftField, rightField) => (orderByKey[leftField.key] ?? 9999) - (orderByKey[rightField.key] ?? 9999),
  ) as FieldDefinition[];
}
