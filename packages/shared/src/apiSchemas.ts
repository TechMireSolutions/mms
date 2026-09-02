import { z } from 'zod';
import { type softDeleteBodySchema, type bulkIdsBodySchema } from './schemas/api.dto.js';

/** Shared page/search/sort query fields used by REST list endpoints. */
export const baseListQueryFields = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  search: z.string().max(500).optional(),
  sortField: z.string().optional(),
  sortDir: z.union([z.enum(['asc', 'desc']), z.literal('')]).optional(),
  includeDeleted: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
};

export const baseListQuerySchema = z.object(baseListQueryFields).passthrough();

/** Query flag for trash/archive list views. */
export const includeDeletedQuerySchema = z.object({
  includeDeleted: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
});

export * from './schemas/api.dto.js';

export type BaseListQuery = z.infer<typeof baseListQuerySchema>;
export type IncludeDeletedQuery = z.infer<typeof includeDeletedQuerySchema>;
export type SoftDeleteBody = z.infer<typeof softDeleteBodySchema>;
export type BulkIdsBody = z.infer<typeof bulkIdsBodySchema>;
