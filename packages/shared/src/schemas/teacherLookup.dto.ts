import { z } from 'zod';
import { deepSanitizeStrings } from './sanitize.js';
export const teacherLookupStringItemsSchema = z.array(z.string().min(1).max(200)).max(500);

const teacherLookupPutBodyBaseSchema = z.object({
  items: teacherLookupStringItemsSchema,
}).strict();

export const teacherLookupPutBodySchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  return deepSanitizeStrings(raw);
}, teacherLookupPutBodyBaseSchema);
