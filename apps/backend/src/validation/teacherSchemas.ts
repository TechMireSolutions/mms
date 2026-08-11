import { z } from 'zod';
import {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  teachersListQuerySchema,
  teachersBulkStatusSchema,
  teachersNextEmployeeIdQuerySchema,
  type TeacherRecord,
} from '@mms/shared';
import { bulkIdsBodySchema } from './commonSchemas.js';
import {
  csvExportBodySchema,
  moduleFieldsPrefsAuditBodySchema,
} from './csvExportBodySchema.js';

export {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  teachersListQuerySchema,
  teachersBulkStatusSchema,
  teachersNextEmployeeIdQuerySchema,
  type TeacherRecord,
};

export const teachersDuplicateCheckBodySchema = z.object({
  excludeId: z.string().optional(),
  contactId: z.union([z.string(), z.number()]).optional(),
  employeeId: z.string().max(64).optional(),
});

export const teachersBulkIdsSchema = bulkIdsBodySchema;

export const teachersCsvExportBodySchema = csvExportBodySchema(teachersListQuerySchema);

/** Teachers Setup audit — fields/preferences only (Students parity). */
export const teacherSetupAuditSchema = moduleFieldsPrefsAuditBodySchema;
