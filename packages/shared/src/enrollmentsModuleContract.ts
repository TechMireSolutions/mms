import type { Permission } from './permissions.js';
import { z } from 'zod';

export const enrollmentTimelineItemSchema = z.object({
  ts: z.string(),
  event: z.string(),
  by: z.string(),
});

export type EnrollmentTimelineItem = z.infer<typeof enrollmentTimelineItemSchema>;

export const enrollmentRecordSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  sessionId: z.string(),
  sessionName: z.string(),
  classId: z.string(),
  className: z.string(),
  enrolledDate: z.string(),
  baseFee: z.number(),
  discountType: z.string(),
  discountLabel: z.string(),
  discountPct: z.number(),
  discountAmt: z.number(),
  finalFee: z.number(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  invoiceId: z.string().nullable(),
  paymentStatus: z.enum(["paid", "pending", "none"]),
  notes: z.string(),
  timeline: z.array(enrollmentTimelineItemSchema),
});

export type Enrollment = z.infer<typeof enrollmentRecordSchema>;
export const enrollmentListSchema = z.array(enrollmentRecordSchema);

/** Enrollments module contract — aligns with globle1 universal module architecture. */

export const ENROLLMENTS_MODULE_CONTRACT = {
  moduleId: 'enrollments',
  entityType: 'Enrollment',
  collectionKey: 'enrollments',
  settingsObjectKey: 'enrollments_settings',
  columnPreferencesObjectKey: 'enrollment_user_column_preferences',
  restBasePath: '/api/enrollments',
  analyticsCategory: 'enrollments',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'enrollments.read',
    write: 'enrollments.write',
    delete: 'enrollments.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'enrollments.read',
    reports: 'enrollments.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['list', 'eligibility'] as const,
    bulkActions: ['cancel'] as const,
  },
  defaultPageSize: 12,
} as const;

export type EnrollmentsModuleTier = (typeof ENROLLMENTS_MODULE_CONTRACT.tiers)[number];

