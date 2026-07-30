import type { Dispatch, SetStateAction } from "react";
import { type FieldDefinition, type TabDefinition } from "@mms/shared";

export interface TabHandlerSetters {
  setFormTabs: Dispatch<SetStateAction<TabDefinition[]>>;
  setEnabledTabs: Dispatch<SetStateAction<Set<string>>>;
  setRequiredTabs: Dispatch<SetStateAction<Set<string>>>;
  setTabFields: Dispatch<SetStateAction<Record<string, FieldDefinition[]>>>;
  setTabFieldEnabled: Dispatch<SetStateAction<Record<string, Set<string>>>>;
  setTabFieldRequired: Dispatch<SetStateAction<Record<string, Set<string>>>>;
  setTabFieldUnique: Dispatch<SetStateAction<Record<string, Set<string>>>>;
  setTabFieldDefaultValues: Dispatch<SetStateAction<Record<string, Record<string, unknown>>>>;
  setTabFieldPermissions: Dispatch<SetStateAction<Record<string, Record<string, string[]>>>>;
  setTabFieldOrder: Dispatch<SetStateAction<Record<string, string[]>>>;
}

export function toggleTabEnabled(
  id: string,
  setEnabledTabs: Dispatch<SetStateAction<Set<string>>>,
  setRequiredTabs: Dispatch<SetStateAction<Set<string>>>,
): void {
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
}

export function toggleTabRequired(
  id: string,
  setRequiredTabs: Dispatch<SetStateAction<Set<string>>>,
): void {
  setRequiredTabs((currentRequiredTabs) => {
    const updatedRequiredTabs = new Set(currentRequiredTabs);
    if (updatedRequiredTabs.has(id)) updatedRequiredTabs.delete(id);
    else updatedRequiredTabs.add(id);
    return updatedRequiredTabs;
  });
}

export function handleAddTab(
  label: string,
  formTabs: TabDefinition[],
  setters: TabHandlerSetters,
): void {
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

  setters.setFormTabs((currentTabs) => [...currentTabs, newTab]);
  setters.setEnabledTabs((currentEnabledTabs) => {
    const updatedEnabledTabs = new Set(currentEnabledTabs);
    updatedEnabledTabs.add(key);
    return updatedEnabledTabs;
  });

  setters.setTabFields((currentTabFields) => ({ ...currentTabFields, [key]: [] }));
  setters.setTabFieldEnabled((currentEnabledFields) => ({ ...currentEnabledFields, [key]: new Set() }));
  setters.setTabFieldRequired((currentRequiredFields) => ({ ...currentRequiredFields, [key]: new Set() }));
  setters.setTabFieldUnique((currentUniqueFields) => ({ ...currentUniqueFields, [key]: new Set() }));
  setters.setTabFieldDefaultValues((currentDefaultValues) => ({ ...currentDefaultValues, [key]: {} }));
  setters.setTabFieldPermissions((currentPermissions) => ({ ...currentPermissions, [key]: {} }));
  setters.setTabFieldOrder((currentFieldOrder) => ({ ...currentFieldOrder, [key]: [] }));
}

export function handleDeleteTab(
  key: string,
  setFormTabs: Dispatch<SetStateAction<TabDefinition[]>>,
  setEnabledTabs: Dispatch<SetStateAction<Set<string>>>,
  setRequiredTabs: Dispatch<SetStateAction<Set<string>>>,
): void {
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
}

export function handleRenameTab(
  key: string,
  newLabel: string,
  setFormTabs: Dispatch<SetStateAction<TabDefinition[]>>,
): void {
  if (!newLabel.trim()) return;
  setFormTabs((currentTabs) =>
    currentTabs.map((tab) => (tab.key === key ? { ...tab, label: newLabel.trim() } : tab))
  );
}
