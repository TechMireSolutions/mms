import { z } from 'zod';
import {
  baseListQuerySchema,
  includeDeletedQuerySchema,
  softDeleteBodySchema,
  bulkIdsBodySchema,
  bulkStringIdsBodySchema,
} from '@mms/shared';

export {
  baseListQuerySchema,
  includeDeletedQuerySchema,
  softDeleteBodySchema,
  bulkIdsBodySchema,
  bulkStringIdsBodySchema,
};

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
export const ENTITY_RESOLVE_MAX_IDS = 100;

export const entityResolveBodySchema = z.object({
  ids: z.array(z.string().min(1).max(64)).max(ENTITY_RESOLVE_MAX_IDS),
});

export const widgetQuerySchema = z.object({
  id: z.string().min(1).max(128),
  operation: z.enum(['count', 'sum', 'avg', 'percentage']),
  targetField: z.string().max(128).optional(),
  filterField: z.string().max(128).optional(),
  filterOperator: z.enum(['equals', 'contains', 'gt', 'lt', 'startsWith']).optional(),
  filterValue: z.string().max(256).optional(),
  xAxisField: z.string().max(128).optional(),
  /** Extra AND filters (chart visualizer / multi-rule widgets). */
  filters: z
    .array(
      z.object({
        field: z.string().min(1).max(128),
        operator: z.enum(['equals', 'contains', 'gt', 'lt', 'startsWith']).optional(),
        value: z.string().max(256),
      }),
    )
    .max(8)
    .optional(),
  /** Chart GROUP BY series cap (default 8; visualizer may request up to 50). */
  chartLimit: z.number().int().min(1).max(50).optional(),
});

export const widgetAggregatesBodySchema = z.object({
  widgets: z.array(widgetQuerySchema).max(32),
});
