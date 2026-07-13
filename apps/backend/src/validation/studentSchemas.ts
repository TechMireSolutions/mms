import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import {
  studentCoreSchema,
  studentRecordSchema,
  studentListSchema,
  type StudentRecord,
} from '@mms/shared';

export {
  studentCoreSchema,
  studentRecordSchema,
  studentListSchema,
  type StudentRecord,
};

export const studentsListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  gender: z.string().optional(),
});

export const studentsNextGrNumberQuerySchema = z.object({
  registeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  template: z.string().max(64).optional(),
  digits: z.coerce.number().int().min(1).max(12).optional(),
  restartAnnually: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export const studentsDuplicateCheckBodySchema = z.object({
  excludeId: z.string().optional(),
  contactId: z.union([z.string(), z.number()]).optional(),
  email: z.string().max(320).optional(),
  name: z.string().max(500).optional(),
  dob: z.string().max(32).optional(),
});
