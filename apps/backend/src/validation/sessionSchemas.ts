import { z } from 'zod';
import { SessionSchema } from '@mms/shared';

export const sessionRecordSchema = SessionSchema.passthrough();
export const sessionListSchema = z.array(sessionRecordSchema);

export const sessionsListQuerySchema = z.object({
  includeDeleted: z.enum(['true', 'false']).optional(),
});

export type SessionRecord = z.infer<typeof sessionRecordSchema>;
