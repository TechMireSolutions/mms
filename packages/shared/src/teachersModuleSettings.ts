import type { TabDefinition, ColumnRegistryEntry } from "./contactTypes.js";

// ─── Teachers Module Settings ─────────────────────────────────────────────────

export interface TeacherFieldConfig {
  enabled?: boolean;
  required?: boolean;
}

export interface TeacherCustomField {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}

/**
 * Configuration for the Teachers module.
 * Stored under the key "teachers_settings".
 */
export interface TeachersSettings {
  idPrefix: string;
  autoGenerateId: boolean;
  requireContactLink: boolean;
  defaultSpecialization: string;
  defaultViewLayout?: string;
  fields?: Record<string, unknown>;
  customFields?: TeacherCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  columnRegistry?: ColumnRegistryEntry[];
}

/** Authoritative default values for TeachersSettings. */
export const DEFAULT_TEACHERS_SETTINGS: TeachersSettings = {
  idPrefix: "TCH",
  autoGenerateId: true,
  requireContactLink: true,
  defaultSpecialization: "General",
  defaultViewLayout: "list",
  fields: {
    specialization: { enabled: true, required: true },
    qualification: { enabled: true, required: false },
    joinDate: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["specialization", "qualification", "joinDate"],
};

export interface TeacherFieldDef {
  id: string;
  labelKey?: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_TEACHER_FIELD_DEFS: TeacherFieldDef[] = [
  { id: "specialization", labelKey: "teachers.field.specialization" },
  { id: "qualification", labelKey: "teachers.field.qualification" },
  { id: "joinDate", labelKey: "teachers.field.joinDate" },
];

/**
 * Returns sorted teacher field definitions (default & custom) per saved order.
 */
export function getSortedTeacherFields(
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, TeacherFieldConfig> | undefined,
  customFields: TeacherCustomField[] | undefined,
): TeacherFieldDef[] {
  const defaultFieldDefinitions = DEFAULT_TEACHER_FIELD_DEFS.map((fieldDefinition) => {
    const teacherFieldConfig = fieldsConfig?.[fieldDefinition.id] || { enabled: true, required: false };
    return {
      ...fieldDefinition,
      enabled: teacherFieldConfig.enabled,
      required: teacherFieldConfig.required,
    };
  });

  const customFieldDefinitions: TeacherFieldDef[] = (customFields || []).map((customField) => ({
    id: customField.id,
    label: customField.label,
    type: customField.type,
    required: customField.required,
    options: customField.options,
    enabled: true,
    isCustom: true,
  }));

  const fieldDefinitions = [...defaultFieldDefinitions, ...customFieldDefinitions];
  const order = fieldOrder || DEFAULT_TEACHERS_SETTINGS.fieldOrder || [];

  const orderIndexByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));
  return fieldDefinitions.sort((leftField, rightField) => {
    const leftOrderIndex = orderIndexByFieldId[leftField.id] ?? 9999;
    const rightOrderIndex = orderIndexByFieldId[rightField.id] ?? 9999;
    return leftOrderIndex - rightOrderIndex;
  });
}
