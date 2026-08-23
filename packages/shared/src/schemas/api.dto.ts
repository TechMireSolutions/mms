import { z } from 'zod';
import { deepSanitizeStrings } from './sanitize.js';

const softDeleteBodyBaseSchema = z.object({
  deletionReason: z.string().max(500).optional(),
}).strict();

/** Soft-delete request body (optional audit reason). */
export const softDeleteBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, softDeleteBodyBaseSchema);

const bulkIdsBodyBaseSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
}).strict();

/** Bulk soft-delete / restore body with capped id list. */
export const bulkIdsBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, bulkIdsBodyBaseSchema);

const bulkStringIdsBodyBaseSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
}).strict();

/** String-only bulk ids (modules that never use numeric ids). */
export const bulkStringIdsBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, bulkStringIdsBodyBaseSchema);
