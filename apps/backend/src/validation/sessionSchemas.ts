import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';
import { SessionSchema } from '@mms/shared';

export const sessionRecordSchema = SessionSchema.passthrough();
/** Create body — `id` optional; service mints `sess-*` when omitted. */
export const sessionCreateBodySchema = SessionSchema.extend({
  id: z.string().optional(),
}).passthrough();
export const sessionListSchema = z.array(sessionRecordSchema);

export const sessionsListQuerySchema = baseListQuerySchema.extend({
  status: z.string().max(200).optional(),
  type: z.string().max(200).optional(),
});

export const sessionsBulkIdsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
});

export type SessionRecord = z.infer<typeof sessionRecordSchema>;
