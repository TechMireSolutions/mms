import { z } from 'zod';
import { deepSanitizeStrings } from './sanitize.js';

const exportColumnSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(200),
}).strict();

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
  const base = z.object({
    query: listQuerySchema.optional(),
    /** Explicit id selection — prefer over page-local FE filtering. */
    ids: z.array(z.union([z.string(), z.number()])).min(1).max(500).optional(),
    columns: z.array(exportColumnSchema).max(50).optional(),
    filename: z.string().min(1).max(200).optional(),
    label: z.string().min(1).max(500).optional(),
    /** Client retry key — reused as the background job id when provided. */
    idempotencyKey: exportIdempotencyKeySchema,
  }).strict();

  return z.preprocess((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    return deepSanitizeStrings(raw);
  }, base);
}

/** Shared Work CSV export audit body (Contacts/Students). */
const moduleExportAuditBodyBaseSchema = z.object({
  count: z.number().int().min(0).max(1_000_000),
  scope: z.enum(['all', 'filtered', 'selection']).optional(),
}).strict();

export const moduleExportAuditBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, moduleExportAuditBodyBaseSchema);

/** Shared Setup save audit body (Contacts includes `sync`; Students uses fields/preferences). */
const moduleSetupAuditBodyBaseSchema = z.object({
  area: z.enum(['fields', 'preferences', 'sync']),
  summary: z.string().min(1).max(500),
}).strict();

export const moduleSetupAuditBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, moduleSetupAuditBodyBaseSchema);

/** Setup audit areas for person modules — fields/preferences only (no Contacts sync tab). */
const moduleFieldsPrefsAuditBodyBaseSchema = z.object({
  area: z.enum(['fields', 'preferences']),
  summary: z.string().min(1).max(500),
}).strict();

export const moduleFieldsPrefsAuditBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, moduleFieldsPrefsAuditBodyBaseSchema);
