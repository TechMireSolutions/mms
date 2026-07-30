import type { AppTranslationKey, FieldDefinition } from "@mms/shared";

export type CustomFieldConfig = FieldDefinition;

export const FIELD_TYPE_KEYS: { value: string; labelKey: AppTranslationKey }[] = [
  { value: "text", labelKey: "fields.type.text" },
  { value: "textarea", labelKey: "fields.type.textarea" },
  { value: "number", labelKey: "fields.type.number" },
  { value: "date", labelKey: "fields.type.date" },
  { value: "url", labelKey: "fields.type.url" },
  { value: "email", labelKey: "fields.type.email" },
  { value: "select", labelKey: "fields.type.select" },
  { value: "tags", labelKey: "fields.type.tags" },
  { value: "boolean", labelKey: "fields.type.boolean" },
];

export function generateFieldId(): string {
  return `cf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeOptions(options: string | string[] | undefined): string[] {
  if (Array.isArray(options)) return options;
  if (typeof options === "string" && options.trim()) {
    return options.split(",").map((option) => option.trim()).filter(Boolean);
  }
  return [];
}

export function optionsToString(options: string[]): string {
  return options.join(", ");
}

export function newField(): CustomFieldConfig {
  const uniqueKey = generateFieldId();
  return {
    key: uniqueKey,
    label: "",
    type: "text",
    enabled: true,
    order: 0,
    required: false,
    unique: false,
    placeholder: "",
    description: "",
    defaultValue: "",
    options: [],
  };
}
