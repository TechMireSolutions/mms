import type { Permission } from './permissions.js';
import { z } from 'zod';
import { normalizeStoredTeacher, stripTeacherClientSoftDeleteFields } from './teacherUtils.js';

export const teacherCoreSchema = z.object({
  /** Optional on create — server assigns `{idPrefix}-{timestamp}` when omitted. */
  id: z.union([z.string(), z.number()]).optional(),
  contactId: z.union([z.string(), z.number()]),
  employeeId: z.string().optional(),
  specialization: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).optional(),
  joinDate: z.string().optional(),
  qualification: z.string().optional(),
  notes: z.string().optional(),
  userId: z.string().nullable().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
}).passthrough();

export const teacherRecordSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    return stripTeacherClientSoftDeleteFields({ ...(raw as Record<string, unknown>) });
  },
  teacherCoreSchema.transform((record) => normalizeStoredTeacher(record)),
);

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
