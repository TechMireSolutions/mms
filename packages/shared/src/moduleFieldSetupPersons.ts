import type { TabDefinition, FieldDefinition, ColumnRegistryEntry } from "./contactTypes.js";


// ─── Default Students Field Setup Constants ───────────────────────────────────

export const DEFAULT_STUDENT_ENABLED_TABS = ["registration"];
export const DEFAULT_STUDENT_REQUIRED_TABS: string[] = [];

export const STUDENT_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Identity", labelKey: "students.form.tab.basic", enabled: true, order: 0, isSystem: true },
  { key: "registration", label: "Registration", labelKey: "students.form.tab.registration", enabled: true, order: 1, isSystem: true },
];

export const INITIAL_STUDENT_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"], enabled: true, order: 0, required: true, description: "Must be defined (not empty) on the linked contact profile." },
    { key: "dob", label: "Date of Birth", type: "date", enabled: true, order: 1, required: true, description: "Must be provided (not empty) on the linked contact profile." },
    { key: "fatherLink", label: "Father", type: "text", enabled: true, order: 2, required: false, description: "Shown from the linked contact’s Father relationship in Contacts (not a picker on this form)." },
    { key: "motherLink", label: "Mother", type: "text", enabled: true, order: 3, required: false, description: "Shown from the linked contact’s Mother relationship in Contacts (not a picker on this form)." },
    { key: "guardianLink", label: "Guardian", type: "text", enabled: true, order: 4, required: false, description: "Shown from the linked contact’s Guardian relationship in Contacts (not a picker on this form)." },
  ],
  registration: [
    { key: "registeredDate", label: "Registration Date", type: "date", enabled: true, order: 0, required: true, description: "Timestamp set when the student profile is registered; displayed read-only on the form." },
  ],
};

export const DEFAULT_STUDENT_COLUMN_REGISTRY: ColumnRegistryEntry[] = [
  { key: "name", label: "Name", enabled: true, order: 0, sortable: true, width: 0, fixed: true },
  { key: "grNumber", label: "GR Number", enabled: true, order: 1, sortable: true, width: 120 },
  { key: "gender", label: "Gender", enabled: true, order: 2, sortable: true, width: 100 },
  { key: "status", label: "Status", enabled: true, order: 3, sortable: true, width: 100 },
  { key: "fatherName", label: "Father Name", enabled: true, order: 4, sortable: true, width: 150 },
  { key: "registeredDate", label: "Registered Date", enabled: true, order: 5, sortable: true, width: 130 },
];

// ─── Default Teachers Field Setup Constants ────────────────────────────────────

export const TEACHERS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Profile", enabled: true, order: 0, isSystem: true },
  { key: "employment", label: "Employment Details", enabled: true, order: 1, isSystem: true },
];

export const INITIAL_TEACHERS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "specialization", label: "Specialization", type: "select", options: ["General", "Hifz", "Tajweed", "Arabic", "Islamic Studies", "Hadith", "Fiqh"], enabled: true, order: 0, required: true },
    { key: "qualification", label: "Qualification", type: "text", enabled: true, order: 1, required: false },
  ],
  employment: [
    { key: "joinDate", label: "Joining Date", type: "date", enabled: true, order: 0, required: true },
  ]
};

// ─── Default Users Field Setup Constants ───────────────────────────────────────

export const USERS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Account Info", enabled: true, order: 0, isSystem: true },
  { key: "security", label: "Security & Roles", enabled: true, order: 1, isSystem: true },
];

export const INITIAL_USERS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "name", label: "Full Name", type: "text", enabled: true, order: 0, required: true },
    { key: "email", label: "Email Address", type: "email", enabled: true, order: 1, required: true },
  ],
  security: [
    { key: "roles", label: "System Roles", type: "multiselect", options: ["admin", "teacher", "student", "guardian", "accountant"], enabled: true, order: 0, required: true },
  ]
};
