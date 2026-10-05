import type { AppTranslationKey } from './appTranslations.js';
import type { ColumnRegistryEntry } from './contactFieldSchemaTypes.js';

export interface FacultyWorkColumnLabels {
  name: string;
  designation: string;
  specialization: string;
  qualification: string;
  joinDate: string;
  status: string;
}

/**
 * Single Faculty directory column-surface SSOT.
 * Work / sort / export allowlists and default Work registry derive from this table.
 */
export const FACULTY_DIRECTORY_COLUMN_SURFACES = [
  {
    key: 'name', work: true, sort: true, export: true, fixed: true,
    workOrder: 0, sortOrder: 0, exportOrder: 0,
    label: 'Name', labelKey: 'faculty.field.name' as AppTranslationKey,
    exportLabel: 'Name', width: 200, sortable: true,
  },
  {
    key: 'employeeId', work: false, sort: true, export: true, fixed: false,
    workOrder: -1, sortOrder: 1, exportOrder: 1,
    label: 'Employee ID', labelKey: 'faculty.field.employeeId' as AppTranslationKey,
    exportLabel: 'Employee ID', width: undefined, sortable: true,
  },
  {
    key: 'designation', work: true, sort: true, export: true, fixed: false,
    workOrder: 1, sortOrder: 2, exportOrder: 2,
    label: 'Designation', labelKey: 'faculty.field.designation' as AppTranslationKey,
    exportLabel: 'Designation', width: 140, sortable: true,
    mapping: { tabId: 'employment', fieldId: 'designation' },
  },
  {
    key: 'department', work: false, sort: true, export: true, fixed: false,
    workOrder: -1, sortOrder: 2, exportOrder: 2,
    label: 'Department', labelKey: 'faculty.field.department' as AppTranslationKey,
    exportLabel: 'Department', width: 140, sortable: true,
    mapping: { tabId: 'employment', fieldId: 'department' },
  },
  {
    key: 'reportingFacultyName', work: false, sort: false, export: true, fixed: false,
    workOrder: -1, sortOrder: -1, exportOrder: 3,
    label: 'Supervisor', labelKey: 'faculty.columns.supervisor' as AppTranslationKey,
    exportLabel: 'Supervisor', width: 140, sortable: false,
  },
  {
    key: 'specialization', work: true, sort: true, export: true, fixed: false,
    workOrder: 2, sortOrder: 3, exportOrder: 3,
    label: 'Specialization', labelKey: 'faculty.field.specialization' as AppTranslationKey,
    exportLabel: 'Specialization', width: 140, sortable: true,
    mapping: { tabId: 'basic', fieldId: 'specialization' },
  },
  {
    key: 'qualification', work: true, sort: true, export: true, fixed: false,
    workOrder: 3, sortOrder: 4, exportOrder: 5,
    label: 'Qualification', labelKey: 'faculty.field.qualification' as AppTranslationKey,
    exportLabel: 'Qualification', width: 140, sortable: true,
    mapping: { tabId: 'basic', fieldId: 'qualification' },
  },
  {
    key: 'joinDate', work: true, sort: true, export: true, fixed: false,
    workOrder: 4, sortOrder: 6, exportOrder: 6,
    label: 'Join Date', labelKey: 'faculty.field.joinDate' as AppTranslationKey,
    exportLabel: 'Join date', width: 120, sortable: true,
    mapping: { tabId: 'employment', fieldId: 'joinDate' },
  },
  {
    key: 'status', work: true, sort: true, export: true, fixed: false,
    workOrder: 5, sortOrder: 5, exportOrder: 4,
    label: 'Status', labelKey: 'faculty.field.status' as AppTranslationKey,
    exportLabel: 'Status', width: 100, sortable: true,
    mapping: { tabId: 'employment', fieldId: 'status' },
  },
  {
    key: 'updatedAt', work: false, sort: true, export: false, fixed: false,
    workOrder: -1, sortOrder: 7, exportOrder: -1,
    label: 'Updated', labelKey: undefined,
    exportLabel: 'Updated', width: undefined, sortable: true,
  },
] as const;

export type FacultyDirectoryColumnKey =
  (typeof FACULTY_DIRECTORY_COLUMN_SURFACES)[number]['key'];

/** Work-directory column keys (excluding fixed `name`). */
export const FACULTY_WORK_COLUMN_KEYS = [
  'designation',
  'specialization',
  'qualification',
  'joinDate',
  'status',
] as const;

export type FacultyWorkColumnKey = (typeof FACULTY_WORK_COLUMN_KEYS)[number];

/**
 * Builds the 6-key Work column labels map (`name` + {@link FACULTY_WORK_COLUMN_KEYS}).
 */
export function facultyWorkColumnLabelsFrom(
  resolveLabel: (key: string) => string,
): FacultyWorkColumnLabels {
  const keys = ['name', ...FACULTY_WORK_COLUMN_KEYS] as const;
  const labels = {} as FacultyWorkColumnLabels;
  for (const key of keys) {
    labels[key as keyof FacultyWorkColumnLabels] = resolveLabel(key);
  }
  return labels;
}

/** Default Work column registry (before tenant Fields sync / user overlay). */
export const DEFAULT_FACULTY_COLUMN_REGISTRY: ColumnRegistryEntry[] =
  FACULTY_DIRECTORY_COLUMN_SURFACES
    .filter((surface) => surface.work)
    .slice()
    .sort((left, right) => left.workOrder - right.workOrder)
    .map((surface) => ({
      key: surface.key,
      label: surface.label,
      ...(surface.labelKey ? { labelKey: surface.labelKey } : {}),
      enabled: true,
      order: surface.workOrder,
      sortable: surface.sortable,
      width: surface.width,
      fixed: surface.fixed || undefined,
    }));

/** Face chrome on Faculty Work cards — excluded from metadata tile grid. */
export const FACULTY_CARD_FACE_COLUMN_IDS = new Set(
  FACULTY_DIRECTORY_COLUMN_SURFACES.filter((surface) => surface.fixed && surface.work).map(
    (surface) => surface.key,
  ),
);

/** Maps Work column keys to Setup Fields for enablement sync + field-removal deps. */
export const FACULTY_COLUMN_FIELD_MAPPING: Record<
  FacultyWorkColumnKey,
  { tabId: string; fieldId: string }
> = (() => {
  const mapping = {} as Record<FacultyWorkColumnKey, { tabId: string; fieldId: string }>;
  for (const surface of FACULTY_DIRECTORY_COLUMN_SURFACES) {
    if (!surface.work || !('mapping' in surface) || !surface.mapping) continue;
    mapping[surface.key as FacultyWorkColumnKey] = {
      tabId: surface.mapping.tabId,
      fieldId: surface.mapping.fieldId,
    };
  }
  return mapping;
})();

/** Work-list / SQL sort keys for faculty (FE + BE SSOT). */
export const FACULTY_SORT_FIELDS = [
  'name',
  'employeeId',
  'department',
  'designation',
  'specialization',
  'qualification',
  'status',
  'joinDate',
  'updatedAt',
] as const;

export type FacultySortField = (typeof FACULTY_SORT_FIELDS)[number];
export const FACULTY_SORT_FIELD_SET: ReadonlySet<string> = new Set(FACULTY_SORT_FIELDS);

/** Default CSV export columns (English labels; FE may re-label via `t()`). */
export const DEFAULT_FACULTY_EXPORT_COLUMNS = FACULTY_DIRECTORY_COLUMN_SURFACES
  .filter((surface) => surface.export)
  .slice()
  .sort((left, right) => left.exportOrder - right.exportOrder)
  .map((surface) => ({
    id: surface.key,
    label: surface.exportLabel,
  }));

const FACULTY_DIRECTORY_COLUMN_SURFACES_BY_KEY = new Map<
  string,
  (typeof FACULTY_DIRECTORY_COLUMN_SURFACES)[number]
>(FACULTY_DIRECTORY_COLUMN_SURFACES.map((item) => [item.key, item]));

/** Translation key for a Faculty field label (`faculty.field.${fieldKey}` fallback). */
export function facultyFieldLabelKey(fieldKey: string): AppTranslationKey {
  return `faculty.field.${fieldKey}` as AppTranslationKey;
}

/** Translation key for a Faculty column label (surface `labelKey`, else {@link facultyFieldLabelKey}). */
export function facultyColumnLabelKey(columnKey: string): AppTranslationKey {
  const surface = FACULTY_DIRECTORY_COLUMN_SURFACES_BY_KEY.get(columnKey);
  return surface?.labelKey ?? facultyFieldLabelKey(columnKey);
}
