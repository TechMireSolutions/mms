import {
  enrollmentRecordSchema as sharedEnrollmentRecordSchema,
  enrollmentListSchema as sharedEnrollmentListSchema,
} from '@mms/shared';

export const enrollmentRecordSchema = sharedEnrollmentRecordSchema.passthrough();
export const enrollmentListSchema = sharedEnrollmentListSchema;

export type EnrollmentRecord = typeof enrollmentRecordSchema;
