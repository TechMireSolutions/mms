import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import { csvExportBodySchema } from './csvExportBodySchema.js';
import {
  enrollmentRecordSchema as sharedEnrollmentRecordSchema,
  enrollmentsBulkIdsSchema,
  type Enrollment,
} from '@mms/shared';

export const enrollmentRecordSchema = sharedEnrollmentRecordSchema.passthrough();
export type EnrollmentRecord = Enrollment;

export { enrollmentsBulkIdsSchema };

export const enrollmentsListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  sessionId: z.string().max(100).optional(),
});

export const enrollmentsCsvExportBodySchema = csvExportBodySchema(enrollmentsListQuerySchema);
