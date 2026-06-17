import { z } from 'zod';

const jsonRecord = z.record(z.string(), z.unknown());

export const syncPayloadSchema = z.object({
  collections: z.record(z.string(), z.array(jsonRecord)).optional(),
  objects: z.record(z.string(), jsonRecord).optional(),
});

export const collectionSaveBodySchema = z.union([
  z.array(jsonRecord),
  z.object({ data: z.array(jsonRecord) }),
]);

export function normalizeCollectionSaveBody(body: z.infer<typeof collectionSaveBodySchema>): unknown[] | null {
  if (Array.isArray(body)) return body;
  if ('data' in body && Array.isArray(body.data)) return body.data;
  return null;
}

export type SyncPayloadInput = z.infer<typeof syncPayloadSchema>;
