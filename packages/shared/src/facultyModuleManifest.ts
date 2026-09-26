import type { Permission } from './permissions.js';
import { z } from 'zod';
import { normalizeStoredFaculty, stripFacultyWriteNoise } from './facultyUtils.js';

/** Faculty status write bound — matches lookup item max length. */
export const FACULTY_STATUS_WRITE_MAX = 200;

/**
 * Wire core keys aligned with faculty seed + audit surface.
 * Customs pass via `.catchall`; dynamic schema is `.strict()`.
 */
export const facultyCoreSchema = z.object({
  /** Optional on create — server assigns `{idPrefix}-{timestamp}` when omitted. */
  id: z.union([z.string(), z.number()]).optional(),
  /**
   * Nullish on the wire so `requireContactLink: false` can omit a link.
   * Empty strings are rejected.
   */
  contactId: z.union([z.string().min(1), z.number()]).nullish().transform((value) =>
    value === null ? undefined : value,
  ),
  employeeId: z.string().optional(),
  specialization: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  customDesignation: z.string().trim().optional(),
  reportingFacultyId: z.string().nullable().optional(),
  hierarchyRank: z.coerce.number().int().min(1).max(99).optional().default(10),
  reportingFacultyName: z.string().optional(),
  subordinateCount: z.coerce.number().int().min(0).optional(),
  status: z.string().min(1).max(FACULTY_STATUS_WRITE_MAX).optional(),
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
export const facultyRecordSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    return stripFacultyWriteNoise({ ...(raw as Record<string, unknown>) });
  },
  facultyCoreSchema.transform((record) => normalizeStoredFaculty(record)),
);

/** POST /api/faculty/bulk-status body. */
export const facultyBulkStatusSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  status: z.string().min(1).max(FACULTY_STATUS_WRITE_MAX),
});

/** POST /api/faculty/bulk-specialization body. */
export const facultyBulkSpecializationSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  specialization: z.string().min(1).max(150),
});

export type FacultyBulkSpecializationBody = z.infer<typeof facultyBulkSpecializationSchema>;

/** GET /api/faculty/next-employee-id query. */
export const facultyNextEmployeeIdQuerySchema = z.object({
  prefix: z.string().max(32).optional(),
  template: z.string().max(64).optional(),
  digits: z.coerce.number().int().min(1).max(8).optional(),
  startSeq: z.coerce.number().int().min(1).optional(),
  restartAnnually: z.coerce.boolean().optional(),
});

export const facultyListSchema = z.array(facultyCoreSchema).transform((list) =>
  list.map((record) => normalizeStoredFaculty(record)),
);

export type FacultyRecord = z.infer<typeof facultyCoreSchema>;

/** Faculty module manifest — aligns with globle1 universal module architecture. */
export const FACULTY_MODULE_MANIFEST = {
  moduleId: 'faculty',
  moduleAlias: 'teachers',
  entityType: 'FacultyMember',
  collectionKey: 'faculty',
  /** Legacy remap / backup key — typed field-config lives on `faculty_field_configs`. */
  settingsObjectKey: 'faculty_settings',
  configObjectKey: 'faculty_field_config',
  preferencesObjectKey: 'faculty_module_preferences',
  columnPreferencesObjectKey: 'faculty_user_column_preferences',
  restBasePath: '/api/faculty',
  analyticsCategory: 'faculty',
  tiers: ['work', 'reports', 'setup'] as const,
  setupSubTabs: ['preferences'] as const,
  permissions: {
    read: 'faculty.read',
    write: 'faculty.write',
    delete: 'faculty.delete',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'faculty.read',
    reports: 'faculty.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['table', 'cards'] as const,
    bulkActions: ['whatsapp', 'sms', 'email', 'idCards', 'export', 'delete', 'status', 'specialization'] as const,
  },
  defaultExportFilename: 'faculty.csv',
  searchableFieldKeys: ['name', 'employeeId', 'phone', 'email', 'specialization', 'department', 'designation'] as const,
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    /** Active Work exports exclude trash; Work trash UI omits export CTAs. */
    exportsIncludeDeleted: false,
    captureDeletionReason: true,
    retentionDays: null,
  },
  /** Server CSV export page-walk size (rows per streamed chunk). */
  exportChunkSize: 100,
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 100,
} as const;

export type FacultyModuleTier = (typeof FACULTY_MODULE_MANIFEST.tiers)[number];

/* ========================================================================= */
/*                    BACKWARD COMPATIBILITY ALIASES                        */
/* ========================================================================= */

export const TEACHERS_MODULE_MANIFEST = {
  ...FACULTY_MODULE_MANIFEST,
  moduleId: 'teachers',
  entityType: 'Teacher',
  collectionKey: 'teachers',
  settingsObjectKey: 'teachers_settings',
  configObjectKey: 'teacher_field_config',
  preferencesObjectKey: 'teacher_module_preferences',
  columnPreferencesObjectKey: 'teacher_user_column_preferences',
  restBasePath: '/api/teachers',
  analyticsCategory: 'teachers',
  defaultExportFilename: 'teachers.csv',
  permissions: {
    read: 'teachers.read',
    write: 'teachers.write',
    delete: 'teachers.delete',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'teachers.read',
    reports: 'teachers.read',
  } satisfies Record<string, Permission>,
} as const;

export const teacherCoreSchema = facultyCoreSchema;
export const teacherRecordSchema = facultyRecordSchema;
export const teachersBulkStatusSchema = facultyBulkStatusSchema;
export const teachersBulkSpecializationSchema = facultyBulkSpecializationSchema;
export type TeachersBulkSpecializationBody = FacultyBulkSpecializationBody;
export const teachersNextEmployeeIdQuerySchema = facultyNextEmployeeIdQuerySchema;
export const teacherListSchema = facultyListSchema;
export type TeacherRecord = FacultyRecord;
export type TeachersModuleTier = FacultyModuleTier;
export const TEACHER_STATUS_WRITE_MAX = FACULTY_STATUS_WRITE_MAX;
