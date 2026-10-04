import type { TabDefinition, FieldDefinition } from "./contactTypes.js";
import { FACULTY_DEPARTMENT_VALUES } from "./facultyTypes.js";

// ─── Default Faculty Field Setup Constants ────────────────────────────────────

/** Form tabs Setup cannot disable; the form always treats them as on. */
export const FACULTY_LOCKED_ENABLED_TABS = ["basic"] as const;

/** True when `tabKey` is a locked always-on Faculty form tab. */
export function isFacultyLockedEnabledTab(tabKey: string): boolean {
  const key = tabKey.toLowerCase();
  return FACULTY_LOCKED_ENABLED_TABS.some((locked) => locked === key);
}

export const FACULTY_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Profile", labelKey: "faculty.form.tab.basic", enabled: true, order: 0, isSystem: true },
  { key: "employment", label: "Employment Details", labelKey: "faculty.form.tab.employment", enabled: true, order: 1, isSystem: true },
  { key: "designation", label: "Designation", labelKey: "faculty.form.tab.designation", enabled: true, order: 2, isSystem: true },
  // Retired person-level hierarchy UI — kept for Setup migration overlays only.
  { key: "hierarchy", label: "Hierarchy", labelKey: "faculty.form.tab.hierarchy", enabled: false, order: 3, isSystem: true },
];

const FACULTY_SEED_FORM_TAB_KEYS = new Set(
  FACULTY_TAB_REGISTRY.map((tab) => tab.key.toLowerCase()),
);

/** True when `tabKey` is a seeded Faculty form tab (not a tenant custom tab). */
export function isFacultySeedFormTab(tabKey: string): boolean {
  return FACULTY_SEED_FORM_TAB_KEYS.has(tabKey.toLowerCase());
}

/** Seeded Faculty form tab definition when `tabKey` matches the registry. */
export function getFacultySeedFormTab(tabKey: string): TabDefinition | undefined {
  const key = tabKey.toLowerCase();
  return FACULTY_TAB_REGISTRY.find((tab) => tab.key.toLowerCase() === key);
}

export const INITIAL_FACULTY_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    {
      key: "contactId", label: "Contact", labelKey: "faculty.field.contact",
      type: "text", enabled: true, order: 0, required: true,
      description: "Contact picker — links the canonical person record for this faculty member.",
      descriptionKey: "faculty.fields.contactIdDesc",
    },
    {
      key: "specialization", label: "Specialization", labelKey: "faculty.field.specialization",
      type: "select", enabled: false, order: 1, required: false,
      description: "Derived from the linked contact profile (not edited on the faculty form).",
      descriptionKey: "faculty.fields.specializationDesc",
    },
    {
      key: "qualification", label: "Qualification", labelKey: "faculty.field.qualification",
      type: "text", enabled: false, order: 2, required: false,
      description: "Derived from the linked contact profile (not edited on the faculty form).",
      descriptionKey: "faculty.fields.qualificationDesc",
    },
  ],
  employment: [
    {
      key: "employeeId", label: "Employee ID", labelKey: "faculty.field.employeeId",
      type: "text", enabled: true, order: 0, required: true,
      description: "Staff employee ID — auto-assigned from Setup Preferences when enabled.",
      descriptionKey: "faculty.fields.employeeIdDesc",
    },
    {
      key: "status", label: "Status", labelKey: "faculty.field.status",
      type: "select", enabled: true, order: 1, required: true,
      description: "Employment status for this faculty member (options from faculty status lookups).",
      descriptionKey: "faculty.fields.statusDesc",
    },
    {
      key: "joinDate", label: "Joining Date", labelKey: "faculty.field.joinDate",
      type: "date", enabled: true, order: 2, required: true,
      description: "Date the faculty member joined the madrasa.",
      descriptionKey: "faculty.fields.joinDateDesc",
    },
    {
      key: "notes", label: "Notes", labelKey: "faculty.field.notes",
      type: "textarea", enabled: true, order: 3, required: false,
      description: "Internal notes for this faculty record.",
      descriptionKey: "faculty.fields.notesDesc",
    },
  ],
  designation: [
    {
      key: "designation", label: "Designation / Role", labelKey: "faculty.field.designation",
      type: "select", enabled: true, order: 0, required: false,
      description: "Faculty role or academic designation.",
      descriptionKey: "faculty.fields.designationDesc",
    },
    {
      key: "department", label: "Department", labelKey: "faculty.field.department",
      type: "select", options: [...FACULTY_DEPARTMENT_VALUES], enabled: true, order: 1, required: false,
      description: "Academic or administrative department.",
      descriptionKey: "faculty.fields.departmentDesc",
    },
    {
      key: "designationId", label: "Designation (Catalog)", labelKey: "faculty.field.designationCatalog",
      type: "select", enabled: false, order: 2, required: false,
      description: "Alias of designation — controlled by the Designation / Role field.",
      descriptionKey: "faculty.fields.designationCatalogDesc",
    },
    {
      key: "departmentId", label: "Department (Catalog)", labelKey: "faculty.field.departmentCatalog",
      type: "select", enabled: false, order: 3, required: false,
      description: "Alias of department — controlled by the Department field.",
      descriptionKey: "faculty.fields.departmentCatalogDesc",
    },
  ],
  hierarchy: [
    {
      key: "hierarchyRank", label: "Hierarchy Rank", labelKey: "faculty.field.hierarchyRank",
      type: "number", enabled: false, order: 0, required: false,
      description: "Legacy seniority rank (retired from Add Faculty UI).",
      descriptionKey: "faculty.fields.hierarchyRankDesc",
    },
    {
      key: "reportingFacultyId", label: "Reporting Supervisor", labelKey: "faculty.field.reportingSupervisor",
      type: "select", enabled: false, order: 1, required: false,
      description: "Legacy person-level supervisor. Prefer organization position occupancy on appointments.",
      descriptionKey: "faculty.fields.reportingSupervisorDesc",
    },
  ],
};

const FACULTY_SEED_FIELDS_BY_KEY = new Map<string, FieldDefinition>();
for (const tabFields of Object.values(INITIAL_FACULTY_FIELD_SEED)) {
  for (const field of tabFields) {
    if (!FACULTY_SEED_FIELDS_BY_KEY.has(field.key)) {
      FACULTY_SEED_FIELDS_BY_KEY.set(field.key, field);
    }
  }
}

/** Seeded faculty form field by key (across all seed tabs), or `undefined`. */
export function findFacultySeedField(fieldKey: string): FieldDefinition | undefined {
  return FACULTY_SEED_FIELDS_BY_KEY.get(fieldKey);
}
