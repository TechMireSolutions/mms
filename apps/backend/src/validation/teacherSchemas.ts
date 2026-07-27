import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  type TeacherRecord,
} from '@mms/shared';

export {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  type TeacherRecord,
};

export const teachersListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  specialization: z.string().optional(),
});

export const teachersNextEmployeeIdQuerySchema = z.object({
  prefix: z.string().max(16).optional(),
});

export const teachersBulkIdsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
});

export const teachersBulkStatusSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  status: z.enum(['active', 'inactive', 'on_leave']),
});
