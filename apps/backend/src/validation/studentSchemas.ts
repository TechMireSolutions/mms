import { z } from 'zod';
import { bulkIdsBodySchema } from './commonSchemas.js';
import {
  isQueryFlagTrue,
  studentsListQuerySchema,
  studentsBulkEnrollBodySchema,
  studentsDuplicateCheckBodySchema,
  studentsBulkStatusSchema,
} from '@mms/shared';
import {
  csvExportBodySchema,
  moduleFieldsPrefsAuditBodySchema,
} from './csvExportBodySchema.js';

export {
  studentsListQuerySchema,
  studentsBulkEnrollBodySchema,
  studentsDuplicateCheckBodySchema,
  studentsBulkStatusSchema,
};

export const studentsNextGrNumberQuerySchema = z.object({
  registeredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  template: z.string().max(64).optional(),
  digits: z.coerce.number().int().min(1).max(12).optional(),
  restartAnnually: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : isQueryFlagTrue(v))),
});

export const studentsBulkIdsSchema = bulkIdsBodySchema;

export const studentSetupAuditSchema = moduleFieldsPrefsAuditBodySchema;

export const studentsCsvExportBodySchema = csvExportBodySchema(studentsListQuerySchema);
