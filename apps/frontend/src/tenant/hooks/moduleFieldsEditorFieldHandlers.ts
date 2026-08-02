import type { Dispatch, SetStateAction } from "react";
import { type FieldDefinition } from "@mms/shared";
import { CustomFieldConfig } from "@/components/ui/CustomFieldsBuilder";
import { safeArray, syncOrder } from "./moduleFieldsEditorUtils";

export function toggleFieldEnabled(
  tabId: string,
  fieldId: string,
  setTabFieldEnabled: Dispatch<SetStateAction<Record<string, Set<string>>>>,
  setTabFieldRequired: Dispatch<SetStateAction<Record<string, Set<string>>>>,
): void {
  setTabFieldEnabled((currentEnabledFields) => {
    const updatedFieldIds = new Set(currentEnabledFields[tabId]);
    if (updatedFieldIds.has(fieldId)) {
      updatedFieldIds.delete(fieldId);
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
}

export function toggleFieldRequired(
  tabId: string,
  fieldId: string,
  setTabFieldRequired: Dispatch<SetStateAction<Record<string, Set<string>>>>,
): void {
  setTabFieldRequired((currentRequiredFields) => {
    const updatedFieldIds = new Set(currentRequiredFields[tabId]);
    if (updatedFieldIds.has(fieldId)) {
      updatedFieldIds.delete(fieldId);
    } else {
      updatedFieldIds.add(fieldId);
    }
    return { ...currentRequiredFields, [tabId]: updatedFieldIds };
  });
}

export function toggleFieldUnique(
  tabId: string,
  fieldId: string,
  setTabFieldUnique: Dispatch<SetStateAction<Record<string, Set<string>>>>,
): void {
  setTabFieldUnique((currentUniqueFields) => {
    const updatedFieldIds = new Set(currentUniqueFields[tabId] || []);
    if (updatedFieldIds.has(fieldId)) {
      updatedFieldIds.delete(fieldId);
    } else {
      updatedFieldIds.add(fieldId);
    }
    return { ...currentUniqueFields, [tabId]: updatedFieldIds };
  });
}

export function handleReorder(
  tabId: string,
  reorderedFields: FieldDefinition[],
  setTabFieldOrder: Dispatch<SetStateAction<Record<string, string[]>>>,
): void {
  setTabFieldOrder((currentFieldOrder) => ({
    ...currentFieldOrder,
    [tabId]: reorderedFields.map((field) => field.key),
  }));
}

export function handleCustomFieldsChange(
  tabId: string,
  newFields: CustomFieldConfig[],
  setTabFieldOrder: Dispatch<SetStateAction<Record<string, string[]>>>,
  setTabFields: Dispatch<SetStateAction<Record<string, FieldDefinition[]>>>,
  setTabFieldEnabled: Dispatch<SetStateAction<Record<string, Set<string>>>>,
): void {
  const newKeys = newFields.map((field) => field.key);
  setTabFieldOrder((currentFieldOrder) => ({
    ...currentFieldOrder,
    [tabId]: syncOrder(currentFieldOrder[tabId] || [], newKeys),
  }));
  setTabFields((currentTabFields) => ({
    ...currentTabFields,
    [tabId]: newFields as unknown as FieldDefinition[],
  }));
  // Newly added keys are absent from the enabled Set; `Set.has` is false (not
  // nullish), so buildFieldsMap would persist them as enabled:false. Opt new
  // fields in unless the builder marked them disabled.
  setTabFieldEnabled((currentEnabledFields) => {
    const previous = currentEnabledFields[tabId] ?? new Set<string>();
    const next = new Set(previous);
    for (const field of newFields) {
      if (!previous.has(field.key) && field.enabled !== false) {
        next.add(field.key);
      }
    }
    return { ...currentEnabledFields, [tabId]: next };
  });
}

export function handleEditField(
  tabId: string,
  updatedField: FieldDefinition,
  setTabFields: Dispatch<SetStateAction<Record<string, FieldDefinition[]>>>,
): void {
  setTabFields((currentTabFields) => ({
    ...currentTabFields,
    [tabId]: safeArray<FieldDefinition>(currentTabFields[tabId]).map((field) =>
      field.key === updatedField.key ? updatedField : field
    ),
  }));
}

export function handleDeleteField(
  tabId: string,
  fieldId: string,
  setTabFields: Dispatch<SetStateAction<Record<string, FieldDefinition[]>>>,
  setTabFieldOrder: Dispatch<SetStateAction<Record<string, string[]>>>,
): void {
  setTabFields((currentTabFields) => ({
    ...currentTabFields,
    [tabId]: safeArray<FieldDefinition>(currentTabFields[tabId]).filter((field) => field.key !== fieldId),
  }));
  setTabFieldOrder((currentFieldOrder) => ({
    ...currentFieldOrder,
    [tabId]: safeArray<string>(currentFieldOrder[tabId]).filter((id) => id !== fieldId),
  }));
}
