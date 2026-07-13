import { z } from 'zod';

export const resourceIdParamsSchema = z.object({ id: z.string().min(1) });
export const resourceNameParamsSchema = z.object({ name: z.string().min(1) });
export const resourceKeyParamsSchema = z.object({ key: z.string().min(1) });
export const subdomainParamsSchema = z.object({ subdomain: z.string().min(1) });

export const challengeCodeBodySchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(1),
});

export const loginBodySchema = z.object({
  email: z.string().min(3),
  password: z.string().min(6),
});

export const challengeIdBodySchema = z.object({
  challengeId: z.string().min(1),
});

export const handoffBodySchema = z.object({
  code: z.string().min(1),
});

/** Batch resolve entity rows by id (globle2 §10). */
export const entityResolveBodySchema = z.object({
  ids: z.array(z.string().min(1).max(64)).max(100),
});

export const softDeleteBodySchema = z.object({
  deletionReason: z.string().max(500).optional(),
});

export const widgetQuerySchema = z.object({
  id: z.string().min(1).max(128),
  operation: z.enum(['count', 'sum', 'avg', 'percentage']),
  targetField: z.string().max(128).optional(),
  filterField: z.string().max(128).optional(),
  filterOperator: z.enum(['equals', 'contains', 'gt', 'lt']).optional(),
  filterValue: z.string().max(256).optional(),
  xAxisField: z.string().max(128).optional(),
});

export const widgetAggregatesBodySchema = z.object({
  widgets: z.array(widgetQuerySchema).max(32),
});

export const baseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  search: z.string().max(500).optional(),
  sortField: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  includeDeleted: z.enum(['true', 'false']).optional(),
});
