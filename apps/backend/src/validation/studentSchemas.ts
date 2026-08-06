import { z } from 'zod';
import { baseListQuerySchema, bulkIdsBodySchema } from './commonSchemas.js';

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
  grNumber: z.string().max(64).optional(),
});

export const studentsBulkIdsSchema = bulkIdsBodySchema;

export const studentsBulkStatusSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  status: z.string().min(1).max(64),
});
