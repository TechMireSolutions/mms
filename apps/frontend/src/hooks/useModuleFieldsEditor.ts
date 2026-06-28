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
        new Set(safeArray<FieldDefinition>(list).filter((f) => f.enabled).map((f) => f.key)),
      ]),
    ),
  );

  const [tabFieldRequired, setTabFieldRequired] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((f) => f.required).map((f) => f.key)),
      ]),
    ),
  );

  const [tabFieldUnique, setTabFieldUnique] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((f) => f.unique).map((f) => f.key)),
      ]),
    ),
  );

  const [tabFieldDefaultValues, setTabFieldDefaultValues] = useState<Record<string, Record<string, unknown>>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        Object.fromEntries(
          safeArray<FieldDefinition>(list)
            .filter((f) => f.defaultValue !== undefined)
            .map((f) => [f.key, f.defaultValue]),
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
            .filter((f) => f.permissions)
            .map((f) => [f.key, f.permissions as string[]]),
        ),
      ]),
    ),
  );

  const [tabFieldOrder, setTabFieldOrder] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      Object.entries(initialFields).map(([tabId, list]) => [
        tabId,
        safeArray<FieldDefinition>(list).map((f) => f.key),
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
          new Set(safeArray<FieldDefinition>(list).filter((f) => f.enabled).map((f) => f.key)),
        ])
      )
    );
    setTabFieldRequired(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          new Set(safeArray<FieldDefinition>(list).filter((f) => f.required).map((f) => f.key)),
        ])
      )
    );
    setTabFieldUnique(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          new Set(safeArray<FieldDefinition>(list).filter((f) => f.unique).map((f) => f.key)),
        ])
      )
    );
    setTabFieldDefaultValues(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          Object.fromEntries(
            safeArray<FieldDefinition>(list)
              .filter((f) => f.defaultValue !== undefined)
              .map((f) => [f.key, f.defaultValue])
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
              .filter((f) => f.permissions)
              .map((f) => [f.key, f.permissions as string[]])
          ),
        ])
      )
    );
    setTabFieldOrder(
      Object.fromEntries(
        Object.entries(fields).map(([tabId, list]) => [
          tabId,
          safeArray<FieldDefinition>(list).map((f) => f.key),
        ])
      )
    );
  };

  const toggleTabEnabled = (id: string): void => {
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setRequiredTabs((r) => {
          const nr = new Set(r);
          nr.delete(id);
          return nr;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTabRequired = (id: string): void => {
    setRequiredTabs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFieldEnabled = (tabId: string, fieldId: string) => {
    setTabFieldEnabled((prev) => {
      const updated = new Set(prev[tabId]);
      if (updated.has(fieldId)) {
        updated.delete(fieldId);
        // Force-disable requirement if disabled
        setTabFieldRequired((r) => {
          const nextReq = new Set(r[tabId]);
          nextReq.delete(fieldId);
          return { ...r, [tabId]: nextReq };
        });
      } else {
        updated.add(fieldId);
      }
      return { ...prev, [tabId]: updated };
    });
  };

  const toggleFieldRequired = (tabId: string, fieldId: string) => {
    setTabFieldRequired((prev) => {
      const updated = new Set(prev[tabId]);
      if (updated.has(fieldId)) {
        updated.delete(fieldId);
      } else {
        updated.add(fieldId);
      }
      return { ...prev, [tabId]: updated };
    });
  };

  const toggleFieldUnique = (tabId: string, fieldId: string) => {
    setTabFieldUnique((prev) => {
      const updated = new Set(prev[tabId] || []);
      if (updated.has(fieldId)) {
        updated.delete(fieldId);
      } else {
        updated.add(fieldId);
      }
      return { ...prev, [tabId]: updated };
    });
  };

  const handleReorder = (tabId: string, reorderedFields: FieldDefinition[]) => {
    setTabFieldOrder((prev) => ({ ...prev, [tabId]: reorderedFields.map((f) => f.key) }));
  };

  const handleCustomFieldsChange = (tabId: string, newFields: CustomFieldConfig[]): void => {
    const newKeys = newFields.map((f) => f.key);
    setTabFieldOrder((prev) => ({
      ...prev,
      [tabId]: syncOrder(prev[tabId] || [], newKeys),
    }));
    setTabFields((prev) => ({ ...prev, [tabId]: newFields as unknown as FieldDefinition[] }));
  };

  const handleEditField = (tabId: string, updatedField: FieldDefinition) => {
    setTabFields((prev) => ({
      ...prev,
      [tabId]: safeArray<FieldDefinition>(prev[tabId]).map((f) =>
        f.key === updatedField.key ? updatedField : f
      ),
    }));
  };

  const handleDeleteField = (tabId: string, fieldId: string) => {
    setTabFields((prev) => ({
      ...prev,
      [tabId]: safeArray<FieldDefinition>(prev[tabId]).filter((f) => f.key !== fieldId),
    }));
    setTabFieldOrder((prev) => ({
      ...prev,
      [tabId]: safeArray<string>(prev[tabId]).filter((id) => id !== fieldId),
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

    setFormTabs((prev) => [...prev, newTab]);
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    setTabFields((prev) => ({ ...prev, [key]: [] }));
    setTabFieldEnabled((prev) => ({ ...prev, [key]: new Set() }));
    setTabFieldRequired((prev) => ({ ...prev, [key]: new Set() }));
    setTabFieldUnique((prev) => ({ ...prev, [key]: new Set() }));
    setTabFieldDefaultValues((prev) => ({ ...prev, [key]: {} }));
    setTabFieldPermissions((prev) => ({ ...prev, [key]: {} }));
    setTabFieldOrder((prev) => ({ ...prev, [key]: [] }));
  };

  const handleDeleteTab = (key: string) => {
    setFormTabs((prev) => prev.filter((t) => t.key !== key));
    setEnabledTabs((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setRequiredTabs((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleRenameTab = (key: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    setFormTabs((prev) =>
      prev.map((t) => (t.key === key ? { ...t, label: newLabel.trim() } : t))
    );
  };

  const buildFieldsMap = (): Record<string, FieldDefinition[]> => {
    const newFields: Record<string, FieldDefinition[]> = {};
    formTabs.forEach((tab) => {
      const tabId = tab.key;
      const combined = safeArray<FieldDefinition>(tabFields[tabId]).map((f) => {
        const fieldKey = f.key || (f as { id?: string }).id || "";
        const enabled = tabFieldEnabled[tabId]?.has(fieldKey) ?? f.enabled ?? false;
        const required = tabFieldRequired[tabId]?.has(fieldKey) ?? f.required ?? false;
        const unique = tabFieldUnique[tabId]?.has(fieldKey) ?? f.unique ?? false;
        const orderArray = tabFieldOrder[tabId] || [];
        const orderIdx = orderArray.indexOf(fieldKey);
        const order = orderIdx >= 0 ? orderIdx : f.order ?? 999;
        const defaultValue = tabFieldDefaultValues[tabId]?.[fieldKey] ?? f.defaultValue;
        const permissions = tabFieldPermissions[tabId]?.[fieldKey] ?? f.permissions;

        return {
          ...f,
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