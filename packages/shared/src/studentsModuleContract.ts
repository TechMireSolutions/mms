import type { Permission } from './permissions.js';
import { z } from 'zod';
import { normalizeStoredStudent } from './studentUtils.js';

export const studentCoreSchema = z.object({
  id: z.union([z.string(), z.number()]),
  contactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
  fatherContactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
  motherContactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
  guardianContactId: z.union([z.string(), z.number()]).nullish().transform(v => v === null ? undefined : v),
  studentId: z.string().optional(),
  status: z.string().optional(),
  enrollmentDate: z.string().optional(),
  notes: z.string().optional(),
  name: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  city: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianName: z.string().optional(),
}).passthrough();

export const studentRecordSchema = studentCoreSchema.transform((record) =>
  normalizeStoredStudent(record),
);

export const studentListSchema = z.array(studentCoreSchema).transform((list) =>
  list.map((record) => normalizeStoredStudent(record)),
);

export type StudentRecord = z.infer<typeof studentCoreSchema>;


/** Students module contract — aligns with globle1 universal module architecture. */
export const STUDENTS_MODULE_CONTRACT = {
  moduleId: 'students',
  entityType: 'Student',
  collectionKey: 'students',
  settingsObjectKey: 'students_settings',
  columnPreferencesObjectKey: 'student_user_column_preferences',
  restBasePath: '/api/students',
  analyticsCategory: 'students',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'students.read',
    write: 'students.write',
    delete: 'students.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'students.read',
    reports: 'students.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list', 'cards'] as const,
    bulkActions: ['export', 'delete', 'status'] as const,
  },
  /** Default Work directory page size when using server pagination (globle1 §10). */
  defaultPageSize: 50,
  maxPageSize: 500,
} as const;

export type StudentsModuleTier = (typeof STUDENTS_MODULE_CONTRACT.tiers)[number];
