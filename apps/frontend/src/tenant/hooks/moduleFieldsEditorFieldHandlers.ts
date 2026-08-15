import type { Dispatch, SetStateAction } from "react";
import type { FieldDefinition } from "@mms/shared";
import { safeArray, syncOrder } from "./moduleFieldsEditorUtils";

export type CustomFieldConfig = {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  unique?: boolean;
  enabled?: boolean;
  options?: string[];
  [key: string]: unknown;
};

type StringSetMapSetter = Dispatch<SetStateAction<Record<string, Set<string>>>>;

function syncFlagSet(
  tabId: string,
  fieldKey: string,
  enabled: boolean,
  setFlagSet: StringSetMapSetter,
): void {
  setFlagSet((current) => {
    const next = new Set(current[tabId] ?? []);
    if (enabled) next.add(fieldKey);
    else next.delete(fieldKey);
    return { ...current, [tabId]: next };
  });
}

/** Keep existing Set membership for known keys; opt new keys in when `shouldAdd` is true. */
function mergeNewKeysIntoFlagSet(
  tabId: string,
  newFields: Array<{ key: string }>,
  setFlagSet: StringSetMapSetter,
  shouldAdd: (field: { key: string }) => boolean,
): void {
  const newKeys = new Set(newFields.map((field) => field.key));
  setFlagSet((current) => {
    const previous = current[tabId] ?? new Set<string>();
    const next = new Set([...previous].filter((key) => newKeys.has(key)));
    for (const field of newFields) {
      if (!previous.has(field.key) && shouldAdd(field)) {
        next.add(field.key);
      }
    }
    return { ...current, [tabId]: next };
  });
}

export function toggleFieldEnabled(
  tabId: string,
  fieldId: string,
  setTabFieldEnabled: StringSetMapSetter,
  setTabFieldRequired: StringSetMapSetter,
  setTabFieldUnique: StringSetMapSetter,
): void {
  setTabFieldEnabled((currentEnabledFields) => {
    const updatedFieldIds = new Set(currentEnabledFields[tabId] ?? []);
    if (updatedFieldIds.has(fieldId)) {
      updatedFieldIds.delete(fieldId);
      setTabFieldRequired((currentRequiredFields) => {
        const updatedRequiredFieldIds = new Set(currentRequiredFields[tabId] ?? []);
        updatedRequiredFieldIds.delete(fieldId);
        return { ...currentRequiredFields, [tabId]: updatedRequiredFieldIds };
      });
      setTabFieldUnique((currentUniqueFields) => {
        const updatedUniqueFieldIds = new Set(currentUniqueFields[tabId] ?? []);
        updatedUniqueFieldIds.delete(fieldId);
        return { ...currentUniqueFields, [tabId]: updatedUniqueFieldIds };
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
  setTabFieldRequired: StringSetMapSetter,
): void {
  setTabFieldRequired((currentRequiredFields) => {
    const updatedFieldIds = new Set(currentRequiredFields[tabId] ?? []);
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
  setTabFieldUnique: StringSetMapSetter,
): void {
  setTabFieldUnique((currentUniqueFields) => {
    const updatedFieldIds = new Set(currentUniqueFields[tabId] ?? []);
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
  setTabFieldEnabled: StringSetMapSetter,
  setTabFieldRequired: StringSetMapSetter,
  setTabFieldUnique: StringSetMapSetter,
): void {
  const newKeys = newFields.map((field) => field.key);
  setTabFieldOrder((currentFieldOrder) => ({
    ...currentFieldOrder,
    [tabId]: syncOrder(currentFieldOrder[tabId] ?? [], newKeys),
  }));
  setTabFields((currentTabFields) => ({
    ...currentTabFields,
    [tabId]: newFields as unknown as FieldDefinition[],
  }));
  // Newly added keys are absent from flag Sets; `Set.has` is false (not nullish),
  // so buildFieldsMap would persist them as enabled/required/unique:false.
  mergeNewKeysIntoFlagSet(
    tabId,
    newFields,
    setTabFieldEnabled,
    (field) => (field as CustomFieldConfig).enabled !== false,
  );
  mergeNewKeysIntoFlagSet(
    tabId,
    newFields,
    setTabFieldRequired,
    (field) => Boolean((field as CustomFieldConfig).required),
  );
  mergeNewKeysIntoFlagSet(
    tabId,
    newFields,
    setTabFieldUnique,
    (field) => Boolean((field as CustomFieldConfig).unique),
  );
}

export function handleEditField(
  tabId: string,
  updatedField: FieldDefinition,
  setTabFields: Dispatch<SetStateAction<Record<string, FieldDefinition[]>>>,
  setTabFieldRequired: StringSetMapSetter,
  setTabFieldUnique: StringSetMapSetter,
  setTabFieldDefaultValues?: Dispatch<SetStateAction<Record<string, Record<string, unknown>>>>,
  setTabFieldPermissions?: Dispatch<
    SetStateAction<Record<string, Record<string, string[]>>>
  >,
): void {
  setTabFields((currentTabFields) => ({
    ...currentTabFields,
    [tabId]: safeArray<FieldDefinition>(currentTabFields[tabId]).map((field) =>
      field.key === updatedField.key ? updatedField : field
    ),
  }));
  syncFlagSet(tabId, updatedField.key, Boolean(updatedField.required), setTabFieldRequired);
  syncFlagSet(tabId, updatedField.key, Boolean(updatedField.unique), setTabFieldUnique);
  if (setTabFieldDefaultValues) {
    setTabFieldDefaultValues((current) => ({
      ...current,
      [tabId]: {
        ...(current[tabId] || {}),
        [updatedField.key]: updatedField.defaultValue,
      },
    }));
  }
  if (setTabFieldPermissions) {
    setTabFieldPermissions((current) => ({
      ...current,
      [tabId]: {
        ...(current[tabId] || {}),
        [updatedField.key]: updatedField.permissions ?? [],
      },
    }));
  }
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
