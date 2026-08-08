import { z } from 'zod';
import { usersListQuerySchema } from '@mms/shared';
import {
  csvExportBodySchema,
  moduleExportAuditBodySchema,
} from './csvExportBodySchema.js';

export { usersListQuerySchema };

export const usersCsvExportBodySchema = csvExportBodySchema(usersListQuerySchema);

export const userExportAuditSchema = moduleExportAuditBodySchema;

export const usersBulkBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
});
