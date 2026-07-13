import {
  enrollmentRecordSchema as sharedEnrollmentRecordSchema,
  type Enrollment,
} from '@mms/shared';

export const enrollmentRecordSchema = sharedEnrollmentRecordSchema.passthrough();
export type EnrollmentRecord = Enrollment;
