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

export {
  challengeCodeBodySchema,
  loginBodySchema,
  challengeIdBodySchema,
  handoffBodySchema,
  ENTITY_RESOLVE_MAX_IDS,
  entityResolveBodySchema,
  widgetQuerySchema,
  widgetAggregatesBodySchema,
} from '@mms/shared';

