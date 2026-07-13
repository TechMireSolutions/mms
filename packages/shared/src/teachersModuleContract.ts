import type { Permission } from './permissions.js';
import { z } from 'zod';
import { normalizeStoredTeacher } from './teacherUtils.js';

export const teacherCoreSchema = z.object({
  id: z.union([z.string(), z.number()]),
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

export const teacherRecordSchema = teacherCoreSchema.transform((record) =>
  normalizeStoredTeacher(record),
);

export const teacherListSchema = z.array(teacherCoreSchema).transform((list) =>
  list.map((record) => normalizeStoredTeacher(record)),
);

export type TeacherRecord = z.infer<typeof teacherCoreSchema>;


/** Teachers module contract — aligns with globle1 universal module architecture. */
export const TEACHERS_MODULE_CONTRACT = {
  moduleId: 'teachers',
  entityType: 'Teacher',
  collectionKey: 'teachers',
  settingsObjectKey: 'teachers_settings',
  columnPreferencesObjectKey: 'teacher_user_column_preferences',
  restBasePath: '/api/teachers',
  analyticsCategory: 'teachers',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'teachers.read',
    write: 'teachers.write',
    delete: 'teachers.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'teachers.read',
    reports: 'teachers.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list'] as const,
    bulkActions: ['delete'] as const,
  },
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 500,
} as const;

export type TeachersModuleTier = (typeof TEACHERS_MODULE_CONTRACT.tiers)[number];
