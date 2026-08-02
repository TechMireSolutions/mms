import { z } from 'zod';
import { tenantDatabaseSnapshotSchema } from '@mms/shared';

/**
 * Lookup collections (`genders`, `relationships`, `phoneLabels`, …) store plain strings.
 * Entity / structured collections store objects. Accept both shapes.
 */
export const syncPayloadSchema = tenantDatabaseSnapshotSchema;

export const collectionSaveBodySchema = z.union([
  z.array(z.unknown()),
  z.object({ data: z.array(z.unknown()) }),
]);

export function normalizeCollectionSaveBody(
  body: z.infer<typeof collectionSaveBodySchema>,
): unknown[] {
  if (Array.isArray(body)) return body;
  return body.data;
}
