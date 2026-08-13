import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';

/** Query accepted by the examinations exams Work list endpoint. */
export const examinationsListQuerySchema = baseListQuerySchema.extend({
  /** Comma-separated exam statuses (`upcoming|ongoing|completed|scheduled|cancelled`). */
  status: z.string().max(200).optional(),
});