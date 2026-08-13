import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';

/** Query accepted by the question bank questions Work list endpoint. */
export const questionBankListQuerySchema = baseListQuerySchema.extend({
  /** Comma-separated category ids (JSONB array overlap on `categoryIds`). */
  categoryId: z.string().max(500).optional(),
  /** Comma-separated difficulties (`easy|medium|hard`). */
  difficulty: z.string().max(200).optional(),
});