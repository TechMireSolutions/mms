import { useRef, useState, type Dispatch, type SetStateAction } from "react";
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

  /** True once the user edits the draft — blocks rehydrate from clobbering unsaved work. */
  const draftDirtyRef = useRef(false);

  const trackDirty = <T,>(setter: Dispatch<SetStateAction<T>>): Dispatch<SetStateAction<T>> =>
    (value) => {
      draftDirtyRef.current = true;
      setter(value);
    };

  const dirtySetters = {
    setFormTabs: trackDirty(setFormTabs),
    setEnabledTabs: trackDirty(setEnabledTabs),
    setRequiredTabs: trackDirty(setRequiredTabs),
    setTabFields: trackDirty(setTabFields),
    setTabFieldEnabled: trackDirty(setTabFieldEnabled),
    setTabFieldRequired: trackDirty(setTabFieldRequired),
    setTabFieldUnique: trackDirty(setTabFieldUnique),
    setTabFieldDefaultValues: trackDirty(setTabFieldDefaultValues),
    setTabFieldPermissions: trackDirty(setTabFieldPermissions),
    setTabFieldOrder: trackDirty(setTabFieldOrder),
  };

  const tabHandlerSetters: TabHandlerSetters = dirtySetters;

  const resetAllState = (
    tabs: TabDefinition[],
    fields: Record<string, FieldDefinition[]>,
    enabledT: string[],
    requiredT: string[],
  ) => {
    draftDirtyRef.current = false;
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
    setFormTabs: dirtySetters.setFormTabs,
    tabFields,
    setTabFields: dirtySetters.setTabFields,
    enabledTabs,
    setEnabledTabs: dirtySetters.setEnabledTabs,
    requiredTabs,
    setRequiredTabs: dirtySetters.setRequiredTabs,
    tabFieldEnabled,
    setTabFieldEnabled: dirtySetters.setTabFieldEnabled,
    tabFieldRequired,
    setTabFieldRequired: dirtySetters.setTabFieldRequired,
    tabFieldUnique,
    setTabFieldUnique: dirtySetters.setTabFieldUnique,
    tabFieldDefaultValues,
    setTabFieldDefaultValues: dirtySetters.setTabFieldDefaultValues,
    tabFieldPermissions,
    setTabFieldPermissions: dirtySetters.setTabFieldPermissions,
    tabFieldOrder,
    setTabFieldOrder: dirtySetters.setTabFieldOrder,
    isDraftDirty: (): boolean => draftDirtyRef.current,
    markDraftPristine: (): void => {
      draftDirtyRef.current = false;
    },
    toggleTabEnabled: (id: string) =>
      toggleTabEnabledImpl(id, dirtySetters.setEnabledTabs, dirtySetters.setRequiredTabs),
    toggleTabRequired: (id: string) => toggleTabRequiredImpl(id, dirtySetters.setRequiredTabs),
    toggleFieldEnabled: (tabId: string, fieldId: string) =>
      toggleFieldEnabledImpl(
        tabId,
        fieldId,
        dirtySetters.setTabFieldEnabled,
        dirtySetters.setTabFieldRequired,
        dirtySetters.setTabFieldUnique,
      ),
    toggleFieldRequired: (tabId: string, fieldId: string) =>
      toggleFieldRequiredImpl(tabId, fieldId, dirtySetters.setTabFieldRequired),
    toggleFieldUnique: (tabId: string, fieldId: string) =>
      toggleFieldUniqueImpl(tabId, fieldId, dirtySetters.setTabFieldUnique),
    handleReorder: (tabId: string, reorderedFields: FieldDefinition[]) =>
      handleReorderImpl(tabId, reorderedFields, dirtySetters.setTabFieldOrder),
    resetAllState,
    handleCustomFieldsChange: (tabId: string, newFields: Parameters<typeof handleCustomFieldsChangeImpl>[1]) =>
      handleCustomFieldsChangeImpl(
        tabId,
        newFields,
        dirtySetters.setTabFieldOrder,
        dirtySetters.setTabFields,
        dirtySetters.setTabFieldEnabled,
        dirtySetters.setTabFieldRequired,
        dirtySetters.setTabFieldUnique,
      ),
    handleEditField: (tabId: string, updatedField: FieldDefinition) =>
      handleEditFieldImpl(
        tabId,
        updatedField,
        dirtySetters.setTabFields,
        dirtySetters.setTabFieldRequired,
        dirtySetters.setTabFieldUnique,
        dirtySetters.setTabFieldDefaultValues,
        dirtySetters.setTabFieldPermissions,
      ),
    handleDeleteField: (tabId: string, fieldId: string) =>
      handleDeleteFieldImpl(tabId, fieldId, dirtySetters.setTabFields, dirtySetters.setTabFieldOrder),
    handleAddTab: (label: string) => handleAddTabImpl(label, formTabs, tabHandlerSetters),
    handleDeleteTab: (key: string) => handleDeleteTabImpl(key, tabHandlerSetters),
    handleRenameTab: (key: string, newLabel: string) =>
      handleRenameTabImpl(key, newLabel, dirtySetters.setFormTabs),
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
