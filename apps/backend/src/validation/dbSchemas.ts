import { z } from 'zod';
import { tenantDatabaseSnapshotSchema } from '@mms/shared';

const jsonRecord = z.record(z.string(), z.unknown());

export const syncPayloadSchema = tenantDatabaseSnapshotSchema;

export const collectionSaveBodySchema = z.union([
  z.array(jsonRecord),
  z.object({ data: z.array(jsonRecord) }),
]);

export function normalizeCollectionSaveBody(
  body: z.infer<typeof collectionSaveBodySchema>,
): unknown[] {
  if (Array.isArray(body)) return body;
  return body.data;
}
