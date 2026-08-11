import type { Permission } from './permissions.js';
import { z } from 'zod';
import { normalizeStoredTeacher, stripTeacherWriteNoise } from './teacherUtils.js';

/** Teacher status write bound — matches lookup item max length. */
export const TEACHER_STATUS_WRITE_MAX = 200;

/**
 * Wire core keys aligned with {@link TEACHER_WRITE_SYSTEM_KEYS} seed + audit surface.
 * Customs pass via `.catchall`; dynamic {@link buildDynamicTeacherSchema} is `.strict()`.
 */
export const teacherCoreSchema = z.object({
  /** Optional on create — server assigns `{idPrefix}-{timestamp}` when omitted. */
  id: z.union([z.string(), z.number()]).optional(),
  /**
   * Nullish on the wire so `requireContactLink: false` can omit a link.
   * Empty strings are rejected; dynamic {@link buildDynamicTeacherSchema} enforces required when prefs demand it.
   */
  contactId: z.union([z.string().min(1), z.number()]).nullish().transform((value) =>
    value === null ? undefined : value,
  ),
  employeeId: z.string().optional(),
  specialization: z.string().optional(),
  status: z.string().min(1).max(TEACHER_STATUS_WRITE_MAX).optional(),
  joinDate: z.string().optional(),
  qualification: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
}).catchall(z.unknown());

/** Wire create/update parse — shared write-noise strip + normalize (Contacts SSOT). */
export const teacherRecordSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    return stripTeacherWriteNoise({ ...(raw as Record<string, unknown>) });
  },
  teacherCoreSchema.transform((record) => normalizeStoredTeacher(record)),
);

/** POST /api/teachers/bulk-status body. */
export const teachersBulkStatusSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  status: z.string().min(1).max(TEACHER_STATUS_WRITE_MAX),
});

/** GET /api/teachers/next-employee-id query. */
export const teachersNextEmployeeIdQuerySchema = z.object({
  prefix: z.string().max(16).optional(),
});

export const teacherListSchema = z.array(teacherCoreSchema).transform((list) =>
  list.map((record) => normalizeStoredTeacher(record)),
);

export type TeacherRecord = z.infer<typeof teacherCoreSchema>;


/** Teachers module manifest — aligns with globle1 universal module architecture. */
export const TEACHERS_MODULE_MANIFEST = {
  moduleId: 'teachers',
  entityType: 'Teacher',
  collectionKey: 'teachers',
  /** Legacy remap / backup key — typed field-config lives on `teacher_field_configs`. */
  settingsObjectKey: 'teachers_settings',
  configObjectKey: 'teacher_field_config',
  preferencesObjectKey: 'teacher_module_preferences',
  columnPreferencesObjectKey: 'teacher_user_column_preferences',
  restBasePath: '/api/teachers',
  analyticsCategory: 'teachers',
  tiers: ['work', 'reports', 'setup'] as const,
  setupSubTabs: ['fields', 'preferences', 'lookups'] as const,
  permissions: {
    read: 'teachers.read',
    write: 'teachers.write',
    delete: 'teachers.delete',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'teachers.read',
    reports: 'teachers.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['table', 'cards'] as const,
    bulkActions: ['whatsapp', 'sms', 'email', 'export', 'delete', 'status'] as const,
  },
  defaultExportFilename: 'teachers.csv',
  searchableFieldKeys: ['name', 'employeeId', 'phone', 'email', 'specialization'] as const,
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    /** Active Work exports exclude trash; Work trash UI omits export CTAs. */
    exportsIncludeDeleted: false,
    captureDeletionReason: true,
  },
  exportInlineMaxRows: 500,
  exportChunkSize: 100,
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 500,
} as const;

export type TeachersModuleTier = (typeof TEACHERS_MODULE_MANIFEST.tiers)[number];
