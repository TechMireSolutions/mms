import { z } from 'zod';

/** Shared page/search/sort query fields used by REST list endpoints. */
export const baseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  search: z.string().max(500).optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  includeDeleted: z.enum(['true', 'false']).optional(),
});

/** Query flag for trash/archive list views. */
export const includeDeletedQuerySchema = z.object({
  includeDeleted: z.enum(['true', 'false']).optional(),
});

/** Soft-delete request body (optional audit reason). */
export const softDeleteBodySchema = z.object({
  deletionReason: z.string().max(500).optional(),
});

/** Bulk soft-delete / restore body with capped id list. */
export const bulkIdsBodySchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
});

/** String-only bulk ids (modules that never use numeric ids). */
export const bulkStringIdsBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
});

export type BaseListQuery = z.infer<typeof baseListQuerySchema>;
export type IncludeDeletedQuery = z.infer<typeof includeDeletedQuerySchema>;
export type SoftDeleteBody = z.infer<typeof softDeleteBodySchema>;
export type BulkIdsBody = z.infer<typeof bulkIdsBodySchema>;
