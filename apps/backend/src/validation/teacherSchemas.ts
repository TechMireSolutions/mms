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
  moduleExportAuditBodySchema,
  studentSetupAuditBodySchema,
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

export const teachersBulkIdsSchema = bulkIdsBodySchema;

export const teachersCsvExportBodySchema = csvExportBodySchema(teachersListQuerySchema);

export const teacherExportAuditSchema = moduleExportAuditBodySchema;

/** Teachers Setup audit — fields/preferences only (Students parity). */
export const teacherSetupAuditSchema = studentSetupAuditBodySchema;
