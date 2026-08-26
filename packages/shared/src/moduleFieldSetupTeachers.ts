import type { TabDefinition, FieldDefinition } from "./contactTypes.js";

// ─── Default Teachers Field Setup Constants ────────────────────────────────────

/** Form tabs Setup cannot disable; the form always treats them as on. */
export const TEACHER_LOCKED_ENABLED_TABS = ["basic"] as const;

/** True when `tabKey` is a locked always-on Teachers form tab. */
export function isTeacherLockedEnabledTab(tabKey: string): boolean {
  const key = tabKey.toLowerCase();
  return TEACHER_LOCKED_ENABLED_TABS.some((locked) => locked === key);
}

export const TEACHERS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Profile", labelKey: "teachers.form.tab.basic", enabled: true, order: 0, isSystem: true },
  { key: "employment", label: "Employment Details", labelKey: "teachers.form.tab.employment", enabled: true, order: 1, isSystem: true },
];

const TEACHER_SEED_FORM_TAB_KEYS = new Set(
  TEACHERS_TAB_REGISTRY.map((tab) => tab.key.toLowerCase()),
);

/** True when `tabKey` is a seeded Teachers form tab (not a tenant custom tab). */
export function isTeacherSeedFormTab(tabKey: string): boolean {
  return TEACHER_SEED_FORM_TAB_KEYS.has(tabKey.toLowerCase());
}

/** Seeded Teachers form tab definition when `tabKey` matches the registry. */
export function getTeacherSeedFormTab(tabKey: string): TabDefinition | undefined {
  const key = tabKey.toLowerCase();
  return TEACHERS_TAB_REGISTRY.find((tab) => tab.key.toLowerCase() === key);
}

export const INITIAL_TEACHERS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    {
      key: "contactId",
      label: "Contact",
      labelKey: "teachers.field.contact",
      type: "text",
      enabled: true,
      order: 0,
      required: true,
      description: "Contact picker — links the canonical person record for this teacher.",
      descriptionKey: "teachers.fields.contactIdDesc",
    },
    {
      key: "specialization",
      label: "Specialization",
      labelKey: "teachers.field.specialization",
      type: "select",
      enabled: true,
      order: 1,
      required: true,
      description: "Teaching specialization (options from teacher specialization lookups).",
      descriptionKey: "teachers.fields.specializationDesc",
    },
    {
      key: "qualification",
      label: "Qualification",
      labelKey: "teachers.field.qualification",
      type: "text",
      enabled: true,
      order: 2,
      required: false,
      description: "Highest academic or teaching qualification.",
      descriptionKey: "teachers.fields.qualificationDesc",
    },
  ],
  employment: [
    {
      key: "employeeId",
      label: "Employee ID",
      labelKey: "teachers.field.employeeId",
      type: "text",
      enabled: true,
      order: 0,
      required: true,
      description: "Staff employee ID — auto-assigned from Setup Preferences when enabled.",
      descriptionKey: "teachers.fields.employeeIdDesc",
    },
    {
      key: "status",
      label: "Status",
      labelKey: "teachers.field.status",
      type: "select",
      enabled: true,
      order: 1,
      required: true,
      description: "Employment status for this teacher (options from teacher status lookups).",
      descriptionKey: "teachers.fields.statusDesc",
    },
    {
      key: "joinDate",
      label: "Joining Date",
      labelKey: "teachers.field.joinDate",
      type: "date",
      enabled: true,
      order: 2,
      required: true,
      description: "Date the teacher joined the madrasa.",
      descriptionKey: "teachers.fields.joinDateDesc",
    },
    {
      key: "notes",
      label: "Notes",
      labelKey: "teachers.field.notes",
      type: "textarea",
      enabled: true,
      order: 3,
      required: false,
      description: "Internal notes for this teacher record.",
      descriptionKey: "teachers.fields.notesDesc",
    },
  ],
};

/** Seeded teacher form field by key (across all seed tabs), or `undefined`. */
export function findTeacherSeedField(fieldKey: string): FieldDefinition | undefined {
  for (const tabFields of Object.values(INITIAL_TEACHERS_FIELD_SEED)) {
    const field = tabFields.find((candidate) => candidate.key === fieldKey);
    if (field) return field;
  }
  return undefined;
}

export {
  DEFAULT_TEACHER_COLUMN_REGISTRY,
  TEACHER_CARD_FACE_COLUMN_IDS,
  TEACHER_COLUMN_FIELD_MAPPING,
  TEACHER_WORK_COLUMN_KEYS,
  type TeacherWorkColumnKey,
} from './teacherDirectoryColumns.js';
