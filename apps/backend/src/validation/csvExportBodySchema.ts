import { z } from 'zod';

const exportColumnSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
});

const exportIdempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/)
  .optional();

/**
 * Shared CSV export enqueue body (Contacts/Students). Pass the module list-query schema.
 */
export function csvExportBodySchema<TQuery extends z.ZodType>(listQuerySchema: TQuery) {
  return z.object({
    query: listQuerySchema.optional(),
    /** Explicit id selection — prefer over page-local FE filtering. */
    ids: z.array(z.union([z.string(), z.number()])).min(1).max(500).optional(),
    columns: z.array(exportColumnSchema).max(50).optional(),
    filename: z.string().min(1).max(200).optional(),
    label: z.string().min(1).max(500).optional(),
    /** Client retry key — reused as the background job id when provided. */
    idempotencyKey: exportIdempotencyKeySchema,
  });
}

/** Shared Work CSV export audit body (Contacts/Students). */
export const moduleExportAuditBodySchema = z.object({
  count: z.number().int().min(0).max(1_000_000),
  scope: z.enum(['all', 'filtered', 'selection']).optional(),
});

/** Shared Setup save audit body (Contacts includes `sync`; Students uses fields/preferences). */
export const moduleSetupAuditBodySchema = z.object({
  area: z.enum(['fields', 'preferences', 'sync']),
  summary: z.string().min(1).max(500),
});

/** Setup audit areas for person modules — fields/preferences only (no Contacts sync tab). */
export const moduleFieldsPrefsAuditBodySchema = moduleSetupAuditBodySchema.extend({
  area: z.enum(['fields', 'preferences']),
});
