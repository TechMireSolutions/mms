import { z } from 'zod';

/** Max field keys accepted by `POST /api/contacts/field-usage`. */
export const CONTACT_FIELD_USAGE_BATCH_MAX = 100;

/**
 * Batch body for Contacts Setup field-usage counts.
 * Response: `{ counts: Record<string, number> }` with every requested key present.
 */
export const contactFieldUsageBatchBodySchema = z.object({
  fieldKeys: z
    .array(z.string().min(1).max(128))
    .min(1)
    .max(CONTACT_FIELD_USAGE_BATCH_MAX),
});

export type ContactFieldUsageBatchBody = z.infer<typeof contactFieldUsageBatchBodySchema>;

/** Single-key path params for `GET /api/contacts/field-usage/:fieldKey`. */
export const contactFieldUsageParamsSchema = z.object({
  fieldKey: z.string().min(1).max(128),
});

export type ContactFieldUsageParams = z.infer<typeof contactFieldUsageParamsSchema>;
