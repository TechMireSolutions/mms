import { z } from 'zod';
import { csvExportBodySchema } from './csvExportBodySchema.js';
import {
  SessionSchema,
  sessionCreateBodySchema,
  sessionsBulkIdsSchema,
  sessionsBulkStatusSchema,
  sessionsListQuerySchema,
  type SessionsBulkStatusBody,
  type SessionsListQuery,
} from '@mms/shared';

export const sessionRecordSchema = SessionSchema.strict();

export {
  sessionCreateBodySchema,
  sessionsBulkIdsSchema,
  sessionsBulkStatusSchema,
  sessionsListQuerySchema,
  type SessionsBulkStatusBody,
  type SessionsListQuery,
};

export const sessionListSchema = z.array(sessionRecordSchema);

export const sessionsCsvExportBodySchema = csvExportBodySchema(sessionsListQuerySchema);

export type SessionRecord = z.infer<typeof sessionRecordSchema>;
