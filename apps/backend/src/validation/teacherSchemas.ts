import {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  teachersListQuerySchema,
  teachersBulkStatusSchema,
  teachersBulkSpecializationSchema,
  teachersNextEmployeeIdQuerySchema,
  teachersDuplicateCheckBodySchema,
  teachersCsvExportBodySchema,
  bulkIdsBodySchema,
  moduleFieldsPrefsAuditBodySchema,
  type TeacherRecord,
} from '@mms/shared';

export {
  teacherCoreSchema,
  teacherRecordSchema,
  teacherListSchema,
  teachersListQuerySchema,
  teachersBulkStatusSchema,
  teachersBulkSpecializationSchema,
  teachersNextEmployeeIdQuerySchema,
  teachersDuplicateCheckBodySchema,
  teachersCsvExportBodySchema,
  type TeacherRecord,
};

export const teachersBulkIdsSchema = bulkIdsBodySchema;

/** Teachers Setup audit — fields/preferences only (Students parity). */
export const teacherSetupAuditSchema = moduleFieldsPrefsAuditBodySchema;

