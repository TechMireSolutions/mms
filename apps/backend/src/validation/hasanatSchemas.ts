import { z } from 'zod';
import { baseListQuerySchema } from './commonSchemas.js';

/** Query accepted by the hasanat distributions Work list endpoint. */
export const hasanatListQuerySchema = baseListQuerySchema.extend({
  /** Comma-separated distribution statuses (`active|redeemed|returned`). */
  status: z.string().max(200).optional(),
});