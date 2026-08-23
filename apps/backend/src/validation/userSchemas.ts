import { usersListQuerySchema, usersBulkBodySchema } from '@mms/shared';
import {
  csvExportBodySchema,
  moduleExportAuditBodySchema,
} from './csvExportBodySchema.js';

export { usersListQuerySchema, usersBulkBodySchema };

export const usersCsvExportBodySchema = csvExportBodySchema(usersListQuerySchema);

export const userExportAuditSchema = moduleExportAuditBodySchema;
