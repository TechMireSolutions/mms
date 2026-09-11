import {
  studentsListQuerySchema,
  studentsBulkEnrollBodySchema,
  studentsDuplicateCheckBodySchema,
  studentsBulkStatusSchema,
  studentsNextGrNumberQuerySchema,
} from '@mms/shared';
import {
  csvExportBodySchema,
  moduleFieldsPrefsAuditBodySchema,
} from './csvExportBodySchema.js';
import { bulkIdsBodySchema } from './commonSchemas.js';

export {
  studentsListQuerySchema,
  studentsBulkEnrollBodySchema,
  studentsDuplicateCheckBodySchema,
  studentsBulkStatusSchema,
  studentsNextGrNumberQuerySchema,
};

export const studentsBulkIdsSchema = bulkIdsBodySchema;

export const studentSetupAuditSchema = moduleFieldsPrefsAuditBodySchema;

export const studentsCsvExportBodySchema = csvExportBodySchema(studentsListQuerySchema);
