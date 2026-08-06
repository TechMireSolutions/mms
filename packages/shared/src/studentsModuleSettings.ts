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
 * Field registry + GR prefs live on typed FORCE-RLS tables (`student_field_configs`,
 * `student_module_preferences`). Manifest `settingsObjectKey` remains for migration mapping only.
 */
export interface StudentsSettings {
  /** Whether the system generates GR numbers automatically on registration. */
  autoGenerateId: boolean;
  /** Format pattern for auto-generated GR Numbers, e.g. "{seq}-{year}" or "GR-{seq}". */
  grNumberTemplate: string;
  /** Zero-padding length for the GR number sequence. */
  grNumberDigits: number;
  /** Whether sequence restarts from 1 at the beginning of each year. */
  grNumberRestartAnnually: boolean;
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
  autoGenerateId: true,
  grNumberTemplate: "{seq}-{year}",
  grNumberDigits: 4,
  grNumberRestartAnnually: true,
  fields: {
    gender: { enabled: true, required: true },
    dob: { enabled: true, required: true },
    contactRelationships: { enabled: true, required: false },
    registeredDate: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["gender", "dob", "contactRelationships", "registeredDate"],
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
  { id: "contactRelationships", label: "Relationships" },
  { id: "registeredDate", label: "Registration Date" },
];
