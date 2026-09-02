import { type z } from 'zod';
import { tenantDatabaseSnapshotSchema, collectionSaveBodySchema } from '@mms/shared';

/**
 * Lookup collections (`genders`, `relationships`, `phoneLabels`, …) store plain strings.
 * Entity / structured collections store objects. Accept both shapes.
 */
export const syncPayloadSchema = tenantDatabaseSnapshotSchema;

export { collectionSaveBodySchema };

export function normalizeCollectionSaveBody(
  body: z.infer<typeof collectionSaveBodySchema>,
): unknown[] {
  if (Array.isArray(body)) return body;
  return body.data;
}
