import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import {
  enrollmentRecordSchema as sharedEnrollmentRecordSchema,
  type Enrollment,
} from '@mms/shared';

export const enrollmentRecordSchema = sharedEnrollmentRecordSchema.passthrough();
export type EnrollmentRecord = Enrollment;

export const enrollmentsListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  sessionId: z.string().max(100).optional(),
});

export const enrollmentsBulkIdsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
});
