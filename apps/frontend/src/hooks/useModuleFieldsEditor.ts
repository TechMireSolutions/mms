import { useState } from "react";
import { type FieldDefinition, type TabDefinition } from "@mms/shared";
import { CustomFieldConfig } from "../components/ui/CustomFieldsBuilder";

interface UseFieldsEditorProps {
  initialTabs: TabDefinition[];
  initialFields: Record<string, FieldDefinition[]>;
  initialEnabledTabs: string[];
  initialRequiredTabs: string[];
}

function syncOrder(prevOrder: string[], newFieldIds: string[]): string[] {
  const kept = prevOrder.filter((id) => newFieldIds.includes(id));
  const added = newFieldIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

// Utility to guarantee an array type, preventing crashes from malformed API objects
const safeArray = <T>(arr: unknown): T[] => (Array.isArray(arr) ? arr : []);

/**
 * A reusable hook to manage state for core and custom fields editors.
 * Prevents repeating complex state variables, toggles, and reordering logic.
 */
export function useModuleFieldsEditor({
  initialTabs,
  initialFields,
  initialEnabledTabs,
  initialRequiredTabs,
}: UseFieldsEditorProps) {
  const [formTabs, setFormTabs] = useState<TabDefinition[]>(initialTabs);
  const [tabFields, setTabFields] = useState<Record<string, FieldDefinition[]>>(initialFields);
  const [enabledTabs, setEnabledTabs] = useState<Set<string>>(new Set(initialEnabledTabs));
  const [requiredTabs, setRequiredTabs] = useState<Set<string>>(new Set(initialRequiredTabs));

  // Field toggles
  const [tabFieldEnabled, setTabFieldEnabled] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((field) => field.enabled).map((field) => field.key)),
      ]),
    ),
  );

  const [tabFieldRequired, setTabFieldRequired] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((field) => field.required).map((field) => field.key)),
      ]),
    ),
  );

  const [tabFieldUnique, setTabFieldUnique] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((field) => field.unique).map((field) => field.key)),
      ]),
    ),
  );

  const [tabFieldDefaultValues, setTabFieldDefaultValues] = useState<Record<string, Record<string, unknown>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        Object.fromEntries(
          safeArray<FieldDefinition>(list)
            .filter((field) => field.defaultValue !== undefined)
            .map((field) => [field.key, field.defaultValue]),
        ),
      ]),
    ),
  );

  const [tabFieldPermissions, setTabFieldPermissions] = useState<Record<string, Record<string, string[]>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        Object.fromEntries(
          safeArray<FieldDefinition>(list)
            .filter((field) => field.permissions)
            .map((field) => [field.key, field.permissions as string[]]),
        ),
      ]),
    ),
  );

  const [tabFieldOrder, setTabFieldOrder] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        safeArray<FieldDefinition>(list).map((field) => field.key),
      ]),
    ),
  );

  const resetAllState = (
    tabs: TabDefinition[],
    fields: Record<string, FieldDefinition[]>,
    enabledT: string[],
    requiredT: string[]
  ) => {
    setFormTabs(tabs);
    setTabFields(fields);
    setEnabledTabs(new Set(enabledT));
    setRequiredTabs(new Set(requiredT));

    setTabFieldEnabled(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          new Set(safeArray<FieldDefinition>(list).filter((field) => field.enabled).map((field) => field.key)),
        ])
      )
    );
    setTabFieldRequired(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          new Set(safeArray<FieldDefinition>(list).filter((field) => field.required).map((field) => field.key)),
        ])
      )
    );
    setTabFieldUnique(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          new Set(safeArray<FieldDefinition>(list).filter((field) => field.unique).map((field) => field.key)),
        ])
      )
    );
    setTabFieldDefaultValues(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          Object.fromEntries(
            safeArray<FieldDefinition>(list)
              .filter((field) => field.defaultValue !== undefined)
              .map((field) => [field.key, field.defaultValue])
          ),
        ])
      )
    );
    setTabFieldPermissions(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          Object.fromEntries(
            safeArray<FieldDefinition>(list)
              .filter((field) => field.permissions)
              .map((field) => [field.key, field.permissions as string[]])
          ),
        ])
      )
    );
    setTabFieldOrder(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          safeArray<FieldDefinition>(list).map((field) => field.key),
        ])
      )
    );
  };

  const toggleTabEnabled = (id: string): void => {
    setEnabledTabs((currentEnabledTabs) => {
      const updatedEnabledTabs = new Set(currentEnabledTabs);
      if (updatedEnabledTabs.has(id)) {
        updatedEnabledTabs.delete(id);
        setRequiredTabs((currentRequiredTabs) => {
          const updatedRequiredTabs = new Set(currentRequiredTabs);
          updatedRequiredTabs.delete(id);
          return updatedRequiredTabs;
        });
      } else {
        updatedEnabledTabs.add(id);
      }
      return updatedEnabledTabs;
    });
  };

  const toggleTabRequired = (id: string): void => {
    setRequiredTabs((currentRequiredTabs) => {
      const updatedRequiredTabs = new Set(currentRequiredTabs);
      if (updatedRequiredTabs.has(id)) updatedRequiredTabs.delete(id);
      else updatedRequiredTabs.add(id);
      return updatedRequiredTabs;
    });
  };

  const toggleFieldEnabled = (tabId: string, fieldId: string) => {
    setTabFieldEnabled((currentEnabledFields) => {
      const updatedFieldIds = new Set(currentEnabledFields[tabId]);
      if (updatedFieldIds.has(fieldId)) {
        updatedFieldIds.delete(fieldId);
        // Force-disable requirement if disabled
        setTabFieldRequired((currentRequiredFields) => {
          const updatedRequiredFieldIds = new Set(currentRequiredFields[tabId]);
          updatedRequiredFieldIds.delete(fieldId);
          return { ...currentRequiredFields, [tabId]: updatedRequiredFieldIds };
        });
      } else {
        updatedFieldIds.add(fieldId);
      }
      return { ...currentEnabledFields, [tabId]: updatedFieldIds };
    });
  };

  const toggleFieldRequired = (tabId: string, fieldId: string) => {
    setTabFieldRequired((currentRequiredFields) => {
      const updatedFieldIds = new Set(currentRequiredFields[tabId]);
      if (updatedFieldIds.has(fieldId)) {
        updatedFieldIds.delete(fieldId);
      } else {
        updatedFieldIds.add(fieldId);
      }
      return { ...currentRequiredFields, [tabId]: updatedFieldIds };
    });
  };

  const toggleFieldUnique = (tabId: string, fieldId: string) => {
    setTabFieldUnique((currentUniqueFields) => {
      const updatedFieldIds = new Set(currentUniqueFields[tabId] || []);
      if (updatedFieldIds.has(fieldId)) {
        updatedFieldIds.delete(fieldId);
      } else {
        updatedFieldIds.add(fieldId);
      }
      return { ...currentUniqueFields, [tabId]: updatedFieldIds };
    });
  };

  const handleReorder = (tabId: string, reorderedFields: FieldDefinition[]) => {
    setTabFieldOrder((currentFieldOrder) => ({ ...currentFieldOrder, [tabId]: reorderedFields.map((field) => field.key) }));
  };

  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const newKeys = newFields.map((field) => field.key);
    setTabFieldOrder((currentFieldOrder) => ({
      ...currentFieldOrder,
      [tabId]: syncOrder(currentFieldOrder[tabId] || [], newKeys),
    }));
    setTabFields((currentTabFields) => ({ ...currentTabFields, [tabId]: newFields as unknown as FieldDefinition[] }));
  };

  const handleEditField = (tabId: string, updatedField: FieldDefinition) => {
    setTabFields((currentTabFields) => ({
      ...currentTabFields,
      [tabId]: safeArray<FieldDefinition>(currentTabFields[tabId]).map((field) =>
        field.key === updatedField.key ? updatedField : field
      ),
    }));
  };

  const handleDeleteField = (tabId: string, fieldId: string) => {
    setTabFields((currentTabFields) => ({
      ...currentTabFields,
      [tabId]: safeArray<FieldDefinition>(currentTabFields[tabId]).filter((field) => field.key !== fieldId),
    }));
    setTabFieldOrder((currentFieldOrder) => ({
      ...currentFieldOrder,
      [tabId]: safeArray<string>(currentFieldOrder[tabId]).filter((id) => id !== fieldId),
    }));
  };

  const handleAddTab = (label: string) => {
    if (!label.trim()) return;
    const key = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    const newTab: TabDefinition = {
      key,
      label: label.trim(),
      description: "Custom user-defined tab",
      enabled: true,
      order: formTabs.length,
      isSystem: false,
    };

    setFormTabs((currentTabs) => [...currentTabs, newTab]);
    setEnabledTabs((currentEnabledTabs) => {
      const updatedEnabledTabs = new Set(currentEnabledTabs);
      updatedEnabledTabs.add(key);
      return updatedEnabledTabs;
    });

    setTabFields((currentTabFields) => ({ ...currentTabFields, [key]: [] }));
    setTabFieldEnabled((currentEnabledFields) => ({ ...currentEnabledFields, [key]: new Set() }));
    setTabFieldRequired((currentRequiredFields) => ({ ...currentRequiredFields, [key]: new Set() }));
    setTabFieldUnique((currentUniqueFields) => ({ ...currentUniqueFields, [key]: new Set() }));
    setTabFieldDefaultValues((currentDefaultValues) => ({ ...currentDefaultValues, [key]: {} }));
    setTabFieldPermissions((currentPermissions) => ({ ...currentPermissions, [key]: {} }));
    setTabFieldOrder((currentFieldOrder) => ({ ...currentFieldOrder, [key]: [] }));
  };

  const handleDeleteTab = (key: string) => {
    setFormTabs((currentTabs) => currentTabs.filter((tab) => tab.key !== key));
    setEnabledTabs((currentEnabledTabs) => {
      const updatedEnabledTabs = new Set(currentEnabledTabs);
      updatedEnabledTabs.delete(key);
      return updatedEnabledTabs;
    });
    setRequiredTabs((currentRequiredTabs) => {
      const updatedRequiredTabs = new Set(currentRequiredTabs);
      updatedRequiredTabs.delete(key);
      return updatedRequiredTabs;
    });
  };

  const handleRenameTab = (key: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    setFormTabs((currentTabs) =>
      currentTabs.map((tab) => (tab.key === key ? { ...tab, label: newLabel.trim() } : tab))
    );
  };

  const buildFieldsMap = (): Record<string, FieldDefinition[]> => {
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
  };

  return {
    formTabs,
    setFormTabs,
    tabFields,
    setTabFields,
    enabledTabs,
    setEnabledTabs,
    requiredTabs,
    setRequiredTabs,
    tabFieldEnabled,
    setTabFieldEnabled,
    tabFieldRequired,
    setTabFieldRequired,
    tabFieldUnique,
    setTabFieldUnique,
    tabFieldDefaultValues,
    setTabFieldDefaultValues,
    tabFieldPermissions,
    setTabFieldPermissions,
    tabFieldOrder,
    setTabFieldOrder,
    toggleTabEnabled,
    toggleTabRequired,
    toggleFieldEnabled,
    toggleFieldRequired,
    toggleFieldUnique,
    handleReorder,
    resetAllState,
    handleCustomFieldsChange,
    handleEditField,
    handleDeleteField,
    handleAddTab,
    handleDeleteTab,
    handleRenameTab,
    buildFieldsMap,
  };
}
