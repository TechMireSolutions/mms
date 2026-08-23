import {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  teachersListQuerySchema,
  teachersBulkStatusSchema,
  teachersBulkSpecializationSchema,
  teachersNextEmployeeIdQuerySchema,
  teachersDuplicateCheckBodySchema,
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
  teachersBulkSpecializationSchema,
  teachersNextEmployeeIdQuerySchema,
  teachersDuplicateCheckBodySchema,
  type TeacherRecord,
};

export const teachersBulkIdsSchema = bulkIdsBodySchema;

export const teachersCsvExportBodySchema = csvExportBodySchema(teachersListQuerySchema);

/** Teachers Setup audit — fields/preferences only (Students parity). */
export const teacherSetupAuditSchema = moduleFieldsPrefsAuditBodySchema;
