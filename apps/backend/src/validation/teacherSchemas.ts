import { z } from 'zod';
import {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  teachersListQuerySchema,
  type TeacherRecord,
} from '@mms/shared';
import {
  csvExportBodySchema,
  moduleExportAuditBodySchema,
  studentSetupAuditBodySchema,
} from './csvExportBodySchema.js';

export {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  teachersListQuerySchema,
  type TeacherRecord,
};

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

export const teachersCsvExportBodySchema = csvExportBodySchema(teachersListQuerySchema);

export const teacherExportAuditSchema = moduleExportAuditBodySchema;

export const teacherSetupAuditSchema = studentSetupAuditBodySchema;
