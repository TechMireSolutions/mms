import type { FieldDefinition } from "./contactTypes.js";

/** Resolves the default form value for a contact field definition. */
export function getDefaultFieldValue(field: FieldDefinition): unknown {
  if (field.defaultValue !== undefined && field.defaultValue !== null) {
    return field.defaultValue;
  }

  switch (field.type) {
    case "number":
    case "boolean":
    case "date":
    case "datetime":
    case "location":
    case "file":
      return null;
    case "multiselect":
    case "multi_select":
    case "tags":
      return [];
    default:
      return "";
  }
}

/** Resolves a module field's default using the contact field default rules. */
export function getDefaultModuleFieldValue(field: {
  id: string;
  type?: string;
  defaultValue?: unknown;
}): unknown {
  return getDefaultFieldValue({
    key: field.id,
    type: (field.type || "text") as FieldDefinition['type'],
    defaultValue: field.defaultValue,
    enabled: true,
    order: 0,
    label: "",
  });
}
