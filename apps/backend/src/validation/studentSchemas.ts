import {
  studentsListQuerySchema,
  studentsBulkEnrollBodySchema,
  studentsDuplicateCheckBodySchema,
  studentsBulkStatusSchema,
  studentsNextGrNumberQuerySchema,
  studentsCsvExportBodySchema,
  bulkIdsBodySchema,
  moduleFieldsPrefsAuditBodySchema,
} from '@mms/shared';

export {
  studentsListQuerySchema,
  studentsBulkEnrollBodySchema,
  studentsDuplicateCheckBodySchema,
  studentsBulkStatusSchema,
  studentsNextGrNumberQuerySchema,
  studentsCsvExportBodySchema,
};

export const studentsBulkIdsSchema = bulkIdsBodySchema;
export const studentSetupAuditSchema = moduleFieldsPrefsAuditBodySchema;

