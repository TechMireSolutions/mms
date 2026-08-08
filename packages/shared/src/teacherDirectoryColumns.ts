import type { AppTranslationKey } from './appTranslations.js';
import type { ColumnRegistryEntry } from './contactFieldSchemaTypes.js';

/**
 * Single Teachers directory column-surface SSOT.
 * Work / sort / export allowlists and the default Work registry derive from this table.
 */
export const TEACHER_DIRECTORY_COLUMN_SURFACES = [
  {
    key: 'name',
    work: true,
    sort: true,
    export: true,
    fixed: true,
    workOrder: 0,
    sortOrder: 0,
    exportOrder: 0,
    label: 'Name',
    labelKey: 'teachers.field.name' as AppTranslationKey,
    exportLabel: 'Name',
    width: 200,
    sortable: true,
  },
  {
    key: 'employeeId',
    work: false,
    sort: true,
    export: true,
    fixed: false,
    workOrder: -1,
    sortOrder: 1,
    exportOrder: 1,
    label: 'Employee ID',
    labelKey: 'teachers.field.employeeId' as AppTranslationKey,
    exportLabel: 'Employee ID',
    width: undefined,
    sortable: true,
  },
  {
    key: 'specialization',
    work: true,
    sort: true,
    export: true,
    fixed: false,
    workOrder: 1,
    sortOrder: 2,
    exportOrder: 2,
    label: 'Specialization',
    labelKey: 'teachers.field.specialization' as AppTranslationKey,
    exportLabel: 'Specialization',
    width: 140,
    sortable: true,
    mapping: { tabId: 'basic', fieldId: 'specialization' },
  },
  {
    key: 'qualification',
    work: true,
    sort: true,
    export: true,
    fixed: false,
    workOrder: 2,
    sortOrder: 3,
    exportOrder: 4,
    label: 'Qualification',
    labelKey: 'teachers.field.qualification' as AppTranslationKey,
    exportLabel: 'Qualification',
    width: 140,
    sortable: true,
    mapping: { tabId: 'basic', fieldId: 'qualification' },
  },
  {
    key: 'joinDate',
    work: true,
    sort: true,
    export: true,
    fixed: false,
    workOrder: 3,
    sortOrder: 5,
    exportOrder: 5,
    label: 'Join Date',
    labelKey: 'teachers.field.joinDate' as AppTranslationKey,
    exportLabel: 'Join date',
    width: 120,
    sortable: true,
    mapping: { tabId: 'employment', fieldId: 'joinDate' },
  },
  {
    key: 'status',
    work: true,
    sort: true,
    export: true,
    fixed: false,
    workOrder: 4,
    sortOrder: 4,
    exportOrder: 3,
    label: 'Status',
    labelKey: 'teachers.field.status' as AppTranslationKey,
    exportLabel: 'Status',
    width: 100,
    sortable: true,
    mapping: { tabId: 'employment', fieldId: 'status' },
  },
  {
    key: 'updatedAt',
    work: false,
    sort: true,
    export: false,
    fixed: false,
    workOrder: -1,
    sortOrder: 6,
    exportOrder: -1,
    label: 'Updated',
    labelKey: undefined,
    exportLabel: 'Updated',
    width: undefined,
    sortable: true,
  },
] as const;

export type TeacherDirectoryColumnKey =
  (typeof TEACHER_DIRECTORY_COLUMN_SURFACES)[number]['key'];

/** Work-directory column keys (excluding fixed `name`). */
export const TEACHER_WORK_COLUMN_KEYS = TEACHER_DIRECTORY_COLUMN_SURFACES
  .filter((surface) => surface.work && surface.key !== 'name')
  .slice()
  .sort((left, right) => left.workOrder - right.workOrder)
  .map((surface) => surface.key) as unknown as readonly [
    'specialization',
    'qualification',
    'joinDate',
    'status',
  ];

export type TeacherWorkColumnKey = (typeof TEACHER_WORK_COLUMN_KEYS)[number];

/** Default Work column registry (before tenant Fields sync / user overlay). */
export const DEFAULT_TEACHER_COLUMN_REGISTRY: ColumnRegistryEntry[] =
  TEACHER_DIRECTORY_COLUMN_SURFACES
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

/** Face chrome on Teachers Work cards — excluded from the metadata tile grid. */
export const TEACHER_CARD_FACE_COLUMN_IDS = new Set(
  TEACHER_DIRECTORY_COLUMN_SURFACES.filter((surface) => surface.fixed && surface.work).map(
    (surface) => surface.key,
  ),
);

/** Maps Work column keys to Setup Fields for enablement sync + field-removal deps. */
export const TEACHER_COLUMN_FIELD_MAPPING: Record<
  TeacherWorkColumnKey,
  { tabId: string; fieldId: string }
> = (() => {
  const mapping = {} as Record<TeacherWorkColumnKey, { tabId: string; fieldId: string }>;
  for (const surface of TEACHER_DIRECTORY_COLUMN_SURFACES) {
    if (!surface.work || !('mapping' in surface) || !surface.mapping) continue;
    mapping[surface.key as TeacherWorkColumnKey] = {
      tabId: surface.mapping.tabId,
      fieldId: surface.mapping.fieldId,
    };
  }
  return mapping;
})();

/** Work-list / SQL sort keys for teachers (FE + BE SSOT). */
export const TEACHER_SORT_FIELDS = TEACHER_DIRECTORY_COLUMN_SURFACES
  .filter((surface) => surface.sort)
  .slice()
  .sort((left, right) => left.sortOrder - right.sortOrder)
  .map((surface) => surface.key) as unknown as readonly [
    'name',
    'employeeId',
    'specialization',
    'qualification',
    'status',
    'joinDate',
    'updatedAt',
  ];

export type TeacherSortField = (typeof TEACHER_SORT_FIELDS)[number];

export const TEACHER_SORT_FIELD_SET: ReadonlySet<string> = new Set(TEACHER_SORT_FIELDS);

/** Default CSV export columns (English labels; FE may re-label via `t()`). */
export const DEFAULT_TEACHER_EXPORT_COLUMNS = TEACHER_DIRECTORY_COLUMN_SURFACES
  .filter((surface) => surface.export)
  .slice()
  .sort((left, right) => left.exportOrder - right.exportOrder)
  .map((surface) => ({
    id: surface.key,
    label: surface.exportLabel,
  }));
