import type { Permission } from './permissions.js';
import { z } from 'zod';

const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

export const attendanceRecordSchema = z
  .object({
    id: z.string(),
    classId: z.string(),
    date: z.string(),
    studentId: z.string(),
    studentName: z.string().optional().default(''),
    rollNo: z.string(),
    status: attendanceStatusSchema,
    timeIn: z.string(),
    timeOut: z.string(),
    notes: z.string(),
  })
  .passthrough();

export const attendanceListSchema = z.array(attendanceRecordSchema);

export const attendanceBulkSchema = z.object({
  records: attendanceListSchema,
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;


/** Attendance module contract — aligns with globle1 universal module architecture. */
export const ATTENDANCE_MODULE_CONTRACT = {
  moduleId: 'attendance',
  entityType: 'AttendanceRecord',
  collectionKey: 'attendance_records',
  settingsObjectKey: 'attendance_settings',
  columnPreferencesObjectKey: 'attendance_user_column_preferences',
  restBasePath: '/api/attendance',
  analyticsCategory: 'attendance',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'analytics.view',
    write: 'attendance.write',
    delete: 'users.manage',
    setupView: 'settings.global.write',
    setupWrite: 'settings.global.write',
    export: 'analytics.view',
    reports: 'analytics.view',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['mark', 'records', 'audit'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 15,
} as const;

export type AttendanceModuleTier = (typeof ATTENDANCE_MODULE_CONTRACT.tiers)[number];
