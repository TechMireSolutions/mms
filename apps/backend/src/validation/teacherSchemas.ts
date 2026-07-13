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
