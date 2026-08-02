import { z } from 'zod';
import { tenantDatabaseSnapshotSchema } from '@mms/shared';

/**
 * Lookup collections (`genders`, `relationships`, `phoneLabels`, …) store plain strings.
 * Entity / structured collections store objects. Accept both shapes.
 */
export const syncPayloadSchema = tenantDatabaseSnapshotSchema;

const collectionItemSchema = z.union([z.string(), z.record(z.string(), z.unknown())]);

export const collectionSaveBodySchema = z.union([
  z.array(collectionItemSchema),
  z.object({ data: z.array(collectionItemSchema) }),
]);

export function normalizeCollectionSaveBody(
  body: z.infer<typeof collectionSaveBodySchema>,
): unknown[] {
  if (Array.isArray(body)) return body;
  return body.data;
}
