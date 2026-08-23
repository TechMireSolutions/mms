import { z } from 'zod';
import { deepSanitizeStrings } from './sanitize.js';
import { SessionSchema } from '../sessionTypes.js';

const sessionCreateBodyBaseSchema = SessionSchema.extend({
  id: z.string().optional(),
}).strict();

export const sessionCreateBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, sessionCreateBodyBaseSchema);

const sessionsBulkIdsBaseSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
}).strict();

export const sessionsBulkIdsSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, sessionsBulkIdsBaseSchema);
