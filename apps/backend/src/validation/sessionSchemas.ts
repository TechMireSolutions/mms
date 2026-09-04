import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import { csvExportBodySchema } from './csvExportBodySchema.js';
import {
  SessionSchema,
  sessionCreateBodySchema,
  sessionsBulkIdsSchema,
  sessionsBulkStatusSchema,
  type SessionsBulkStatusBody,
} from '@mms/shared';

export const sessionRecordSchema = SessionSchema.strict();

export {
  sessionCreateBodySchema,
  sessionsBulkIdsSchema,
  sessionsBulkStatusSchema,
  type SessionsBulkStatusBody,
};

export const sessionListSchema = z.array(sessionRecordSchema);

export const sessionsListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  type: z.string().max(200).optional(),
});

export const sessionsCsvExportBodySchema = csvExportBodySchema(sessionsListQuerySchema);

export type SessionRecord = z.infer<typeof sessionRecordSchema>;
