import type { TabDefinition, ColumnRegistryEntry } from "./contactTypes.js";

// ─── Students Module Settings ─────────────────────────────────────────────────

export interface StudentFieldConfig {
  enabled: boolean;
  required: boolean;
}

export interface StudentCustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean" | "date";
  required?: boolean;
  options?: string[];
}

/**
 * Configuration for the Students module.
 * Stored under the key "students_settings".
 */
export interface StudentsSettings {
  /** Prefix for auto-generated student IDs, e.g. "STU". */
  idPrefix: string;
  /** Whether the system generates student IDs automatically. */
  autoGenerateId: boolean;
  /** Whether every student profile must have a guardian linked. */
  requireGuardian: boolean;
  /** Whether a profile photo is mandatory. */
  requirePhoto: boolean;
  /** Default gender pre-selected on the registration form; empty means no default. */
  defaultGender: string;
  /** Maximum allowed student age. */
  maxAge: string;
  /** Minimum allowed student age. */
  minAge: string;
  /** Whether sibling discounts are enabled in the fee structure. */
  allowSiblingDiscount: boolean;
  /** Format pattern for auto-generated GR Numbers, e.g. "{seq}-{year}" or "GR-{seq}". */
  grNumberTemplate: string;
  /** Zero-padding length for the GR number sequence. */
  grNumberDigits: number;
  /** Whether sequence restarts from 1 at the beginning of each year. */
  grNumberRestartAnnually: boolean;
  defaultViewLayout?: string;
  /** Field level customization visibility/requirement toggles */
  fields?: Record<string, unknown>;
  /** User defined dynamic custom fields */
  customFields?: StudentCustomField[];
  /** Sequence ordering of the default and custom fields in the form/views */
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  columnRegistry?: ColumnRegistryEntry[];
  version?: number;
}

/** Authoritative default values for StudentsSettings. */
export const DEFAULT_STUDENTS_SETTINGS: StudentsSettings = {
  idPrefix: "STU",
  autoGenerateId: true,
  requireGuardian: true,
  requirePhoto: false,
  defaultGender: "",
  maxAge: "25",
  minAge: "5",
  allowSiblingDiscount: true,
  grNumberTemplate: "{seq}-{year}",
  grNumberDigits: 4,
  grNumberRestartAnnually: true,
  defaultViewLayout: "table",
  fields: {
    gender: { enabled: true, required: true },
    dob: { enabled: true, required: true },
    fatherLink: { enabled: true, required: false },
    motherLink: { enabled: true, required: false },
    guardianLink: { enabled: true, required: false },
    registeredDate: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["gender", "dob", "fatherLink", "motherLink", "guardianLink", "registeredDate"],
};

export interface StudentFieldDef {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_STUDENT_FIELD_DEFS: StudentFieldDef[] = [
  { id: "gender", label: "Gender" },
  { id: "dob", label: "Date of Birth" },
  { id: "fatherLink", label: "Father" },
  { id: "motherLink", label: "Mother" },
  { id: "guardianLink", label: "Guardian" },
  { id: "registeredDate", label: "Registration Date" },
];

/** Contact-owned fields — list/detail display only; never on the registration form. */
export const STUDENT_CONTACT_PROFILE_FIELD_IDS = ["gender", "dob"] as const;

/**
 * Student form fields excluding contact profile fields (gender, DOB).
 */
export function getStudentRegistrationFields(
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, StudentFieldConfig> | undefined,
  customFields: StudentCustomField[] | undefined,
): StudentFieldDef[] {
  return getSortedStudentFields(fieldOrder, fieldsConfig, customFields).filter(
    (field) => !STUDENT_CONTACT_PROFILE_FIELD_IDS.includes(
      field.id as (typeof STUDENT_CONTACT_PROFILE_FIELD_IDS)[number],
    ),
  );
}

/**
 * Returns a sorted list of all student field definitions (default & custom)
 * based on the saved display sequence order in StudentsSettings.
 */
export function getSortedStudentFields(
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, StudentFieldConfig> | undefined,
  customFields: StudentCustomField[] | undefined
): StudentFieldDef[] {
  const defaultFieldDefinitions = DEFAULT_STUDENT_FIELD_DEFS.map((fieldDefinition) => {
    const studentFieldConfig = fieldsConfig?.[fieldDefinition.id] || { enabled: true, required: false };
    return {
      ...fieldDefinition,
      enabled: studentFieldConfig.enabled,
      required: studentFieldConfig.required,
      isCustom: false,
    };
  });

  const customFieldDefinitions = (customFields || []).map((customField) => ({
    id: customField.id,
    label: customField.label,
    type: customField.type,
    required: customField.required,
    options: customField.options,
    enabled: true,
    isCustom: true,
  }));

  const fieldDefinitions = [...defaultFieldDefinitions, ...customFieldDefinitions];
  const order = fieldOrder || ["gender", "dob", "fatherLink", "motherLink", "guardianLink", "registeredDate"];

  const orderIndexByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));
  return fieldDefinitions.sort((leftField, rightField) => {
    const leftOrderIndex = orderIndexByFieldId[leftField.id] ?? 9999;
    const rightOrderIndex = orderIndexByFieldId[rightField.id] ?? 9999;
    return leftOrderIndex - rightOrderIndex;
  });
}
