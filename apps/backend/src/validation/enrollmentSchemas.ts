import { csvExportBodySchema } from './csvExportBodySchema.js';
import {
  enrollmentRecordSchema,
  enrollmentsListQuerySchema,
  enrollmentsBulkIdsSchema,
  type Enrollment,
  type EnrollmentsListQuery,
} from '@mms/shared';

export {
  enrollmentRecordSchema,
  enrollmentsListQuerySchema,
  enrollmentsBulkIdsSchema,
  type Enrollment,
  type EnrollmentsListQuery,
};

export type EnrollmentRecord = Enrollment;

export const enrollmentsCsvExportBodySchema = csvExportBodySchema(enrollmentsListQuerySchema);
