import { useState } from "react";
import { type FieldDefinition, type TabDefinition } from "@mms/shared";
import { buildFieldsMap } from "./moduleFieldsEditorBuildMap";
import {
  handleCustomFieldsChange as handleCustomFieldsChangeImpl,
  handleDeleteField as handleDeleteFieldImpl,
  handleEditField as handleEditFieldImpl,
  handleReorder as handleReorderImpl,
  toggleFieldEnabled as toggleFieldEnabledImpl,
  toggleFieldRequired as toggleFieldRequiredImpl,
  toggleFieldUnique as toggleFieldUniqueImpl,
} from "./moduleFieldsEditorFieldHandlers";
import {
  handleAddTab as handleAddTabImpl,
  handleDeleteTab as handleDeleteTabImpl,
  handleRenameTab as handleRenameTabImpl,
  toggleTabEnabled as toggleTabEnabledImpl,
  toggleTabRequired as toggleTabRequiredImpl,
  type TabHandlerSetters,
} from "./moduleFieldsEditorTabHandlers";
import type { UseFieldsEditorProps } from "./moduleFieldsEditorTypes";
import { buildFieldDerivedState } from "./moduleFieldsEditorUtils";

export type { UseFieldsEditorProps } from "./moduleFieldsEditorTypes";

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

  const initialDerived = buildFieldDerivedState(initialFields);
  const [tabFieldEnabled, setTabFieldEnabled] = useState(initialDerived.tabFieldEnabled);
  const [tabFieldRequired, setTabFieldRequired] = useState(initialDerived.tabFieldRequired);
  const [tabFieldUnique, setTabFieldUnique] = useState(initialDerived.tabFieldUnique);
  const [tabFieldDefaultValues, setTabFieldDefaultValues] = useState(initialDerived.tabFieldDefaultValues);
  const [tabFieldPermissions, setTabFieldPermissions] = useState(initialDerived.tabFieldPermissions);
  const [tabFieldOrder, setTabFieldOrder] = useState(initialDerived.tabFieldOrder);

  const tabHandlerSetters: TabHandlerSetters = {
    setFormTabs,
    setEnabledTabs,
    setRequiredTabs,
    setTabFields,
    setTabFieldEnabled,
    setTabFieldRequired,
    setTabFieldUnique,
    setTabFieldDefaultValues,
    setTabFieldPermissions,
    setTabFieldOrder,
  };

  const resetAllState = (
    tabs: TabDefinition[],
    fields: Record<string, FieldDefinition[]>,
    enabledT: string[],
    requiredT: string[],
  ) => {
    setFormTabs(tabs);
    setTabFields(fields);
    setEnabledTabs(new Set(enabledT));
    setRequiredTabs(new Set(requiredT));

    const derived = buildFieldDerivedState(fields);
    setTabFieldEnabled(derived.tabFieldEnabled);
    setTabFieldRequired(derived.tabFieldRequired);
    setTabFieldUnique(derived.tabFieldUnique);
    setTabFieldDefaultValues(derived.tabFieldDefaultValues);
    setTabFieldPermissions(derived.tabFieldPermissions);
    setTabFieldOrder(derived.tabFieldOrder);
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
    toggleTabEnabled: (id: string) => toggleTabEnabledImpl(id, setEnabledTabs, setRequiredTabs),
    toggleTabRequired: (id: string) => toggleTabRequiredImpl(id, setRequiredTabs),
    toggleFieldEnabled: (tabId: string, fieldId: string) =>
      toggleFieldEnabledImpl(tabId, fieldId, setTabFieldEnabled, setTabFieldRequired, setTabFieldUnique),
    toggleFieldRequired: (tabId: string, fieldId: string) =>
      toggleFieldRequiredImpl(tabId, fieldId, setTabFieldRequired),
    toggleFieldUnique: (tabId: string, fieldId: string) =>
      toggleFieldUniqueImpl(tabId, fieldId, setTabFieldUnique),
    handleReorder: (tabId: string, reorderedFields: FieldDefinition[]) =>
      handleReorderImpl(tabId, reorderedFields, setTabFieldOrder),
    resetAllState,
    handleCustomFieldsChange: (tabId: string, newFields: Parameters<typeof handleCustomFieldsChangeImpl>[1]) =>
      handleCustomFieldsChangeImpl(
        tabId,
        newFields,
        setTabFieldOrder,
        setTabFields,
        setTabFieldEnabled,
        setTabFieldRequired,
        setTabFieldUnique,
      ),
    handleEditField: (tabId: string, updatedField: FieldDefinition) =>
      handleEditFieldImpl(
        tabId,
        updatedField,
        setTabFields,
        setTabFieldRequired,
        setTabFieldUnique,
        setTabFieldDefaultValues,
        setTabFieldPermissions,
      ),
    handleDeleteField: (tabId: string, fieldId: string) =>
      handleDeleteFieldImpl(tabId, fieldId, setTabFields, setTabFieldOrder),
    handleAddTab: (label: string) => handleAddTabImpl(label, formTabs, tabHandlerSetters),
    handleDeleteTab: (key: string) => handleDeleteTabImpl(key, tabHandlerSetters),
    handleRenameTab: (key: string, newLabel: string) => handleRenameTabImpl(key, newLabel, setFormTabs),
    buildFieldsMap: () =>
      buildFieldsMap(
        formTabs,
        tabFields,
        tabFieldEnabled,
        tabFieldRequired,
        tabFieldUnique,
        tabFieldOrder,
        tabFieldDefaultValues,
        tabFieldPermissions,
      ),
  };
}
