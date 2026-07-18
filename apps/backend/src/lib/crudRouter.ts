import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ZodType } from 'zod';

import type { User } from '@mms/shared';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import { sendForbidden, sendDatabaseError } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';
import {
  resourceIdParamsSchema,
  softDeleteBodySchema,
  entityResolveBodySchema,
  widgetAggregatesBodySchema,
  widgetQuerySchema,
} from '../validation/commonSchemas.js';
import { registerColumnPreferencesRoutes } from './columnPreferencesRouter.js';


export type ResourceRecord = { id?: string | number };
type WidgetQuery = z.infer<typeof widgetQuerySchema>;

export interface BulkRoutesOptions<T> {
  path: string;
  collection: string;
  schema: ZodType<T>;
  loadFn: () => Promise<unknown>;
  saveFn: (data: T) => Promise<unknown>;
  responseKey: string;
  errorMessagePrefix: string;
  columnPreferencesObjectKey?: string;
  columnPreferencesPath?: string;
}

/**
 * Registers GET and PUT endpoints for a bulk list collection.
 */
export function registerBulkRoutes<T>(
  fastify: FastifyInstance,
  options: BulkRoutesOptions<T>,
): void {
  const {
    path,
    collection,
    schema,
    loadFn,
    saveFn,
    responseKey,
    errorMessagePrefix,
    columnPreferencesObjectKey,
    columnPreferencesPath,
  } = options;

  fastify.get(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    try {
      const data = await loadFn();
      return reply.send({ [responseKey]: data });
    } catch {
      return sendDatabaseError(reply, `Failed to load ${errorMessagePrefix}`);
    }
  });

  fastify.put(path === '/' ? '/bulk' : `${path}/bulk`, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, collection)) return sendForbidden(reply);
    const parsed = parseRequest(schema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const updated = await saveFn(parsed.data);
      return reply.send({ [responseKey]: updated });
    } catch {
      return sendDatabaseError(reply, `Failed to update ${errorMessagePrefix}`);
    }
  });

  if (columnPreferencesObjectKey) {
    registerColumnPreferencesRoutes(fastify, {
      path: columnPreferencesPath ?? (path === '/' ? '/column-preferences' : `${path}/column-preferences`),
      collection,
      objectKey: columnPreferencesObjectKey,
    });
  }
}

export interface ResourceRoutesOptions<T extends ResourceRecord> {
  prefix?: string;
  collection: string;
  schema: ZodType<T>;
  loadAllFn?: () => Promise<unknown[]>;
  loadByIdFn?: (id: string, includeDeleted?: boolean) => Promise<unknown | null>;
  createFn?: (data: T) => Promise<unknown>;
  updateFn?: (id: string, data: T) => Promise<unknown | null>;
  deleteFn?: (id: string, userId: string, reason?: string) => Promise<unknown | null>;
  restoreFn?: (id: string) => Promise<unknown | null>;
  nameSingular: string;
  namePlural: string;
  customGetRoute?: boolean;
  customGetSingleRoute?: boolean;
  customPostRoute?: boolean;
  customPutRoute?: boolean;
  columnPreferencesObjectKey?: string;
}

/**
 * Registers standard REST resource CRUD endpoints (GET, POST, PUT, DELETE, restore).
 */
export function registerResourceRoutes<T extends ResourceRecord>(
  fastify: FastifyInstance,
  options: ResourceRoutesOptions<T>,
 ): void {
  const {
    prefix = '',
    collection,
    schema,
    loadAllFn,
    loadByIdFn,
    createFn,
    updateFn,
    deleteFn,
    restoreFn,
    nameSingular,
    namePlural,
    customGetRoute = false,
    customGetSingleRoute = false,
    customPostRoute = false,
    customPutRoute = false,
    columnPreferencesObjectKey,
  } = options;

  // GET / or GET /prefix
  if (!customGetRoute && loadAllFn) {
    fastify.get(prefix || '/', async (request, reply) => {
      const user = request.user as User;
      if (!canReadCollection(user, collection)) return sendForbidden(reply);
      try {
        const data = await loadAllFn();
        return reply.send({ [namePlural]: data });
      } catch {
        return sendDatabaseError(reply, `Failed to list ${namePlural}`);
      }
    });
  }

  // GET /:id or GET /prefix/:id
  if (!customGetSingleRoute && loadByIdFn) {
    fastify.get(`${prefix}/:id`, async (request, reply) => {
      const user = request.user as User;
      if (!canReadCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      try {
        const item = await loadByIdFn(params.data.id, false);
        if (!item) {
          return reply.status(404).send({
            type: 'not_found',
            message: `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found`,
          });
        }
        return reply.send({ [nameSingular]: item });
      } catch {
        return sendDatabaseError(reply, `Failed to load ${nameSingular}`);
      }
    });
  }


  // POST / or POST /prefix
  if (!customPostRoute && createFn) {
    fastify.post(prefix || '/', async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const parsed = parseRequest(schema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      try {
        const item = await createFn(parsed.data);
        return reply.status(201).send({ [nameSingular]: item });
      } catch {
        return sendDatabaseError(reply, `Failed to create ${nameSingular}`);
      }
    });
  }

  // PUT /:id or PUT /prefix/:id
  if (!customPutRoute && updateFn) {
    fastify.put(`${prefix}/:id`, async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      const body = parseRequest(schema, request.body);
      if (!params.ok) return replyValidationError(reply, params.message);
      if (!body.ok) return replyValidationError(reply, body.message);
      try {
        const updated = await updateFn(params.data.id, {
          ...body.data,
          id: body.data.id ?? params.data.id,
        });
        if (!updated) {
          return reply.status(404).send({
            type: 'not_found',
            message: `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found`,
          });
        }
        return reply.send({ [nameSingular]: updated });
      } catch {
        return sendDatabaseError(reply, `Failed to update ${nameSingular}`);
      }
    });
  }

  // DELETE /:id or DELETE /prefix/:id
  if (deleteFn) {
    fastify.delete<{ Params: { id: string } }>(`${prefix}/:id`, async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      const body = parseRequest(softDeleteBodySchema, request.body ?? {});
      if (!body.ok) return replyValidationError(reply, body.message);
      try {
        const deleted = await deleteFn(params.data.id, String(user.id), body.data.deletionReason);
        if (!deleted) {
          return reply.status(404).send({
            type: 'not_found',
            message: `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found`,
          });
        }
        return reply.send({ success: true });
      } catch {
        return sendDatabaseError(reply, `Failed to delete ${nameSingular}`);
      }
    });
  }

  // POST /:id/restore or POST /prefix/:id/restore
  if (restoreFn) {
    fastify.post(`${prefix}/:id/restore`, async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      try {
        const restored = await restoreFn(params.data.id);
        if (!restored) {
          return reply.status(404).send({
            type: 'not_found',
            message: `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found or not deleted`,
          });
        }
        return reply.send({ success: true });
      } catch {
        return sendDatabaseError(reply, `Failed to restore ${nameSingular}`);
      }
    });
  }

  if (columnPreferencesObjectKey) {
    registerColumnPreferencesRoutes(fastify, {
      path: prefix ? `${prefix}/column-preferences` : '/column-preferences',
      collection,
      objectKey: columnPreferencesObjectKey,
    });
  }
}

export interface MetricsRouteOptions {
  path?: string; // defaults to '/metrics'
  collection: string;
  loadMetricsFn: (request: FastifyRequest) => Promise<unknown>;
  errorMessagePrefix: string;
}

/**
 * Registers a standard metrics endpoint with RBAC checks and error handling.
 */
export function registerMetricsRoute(
  fastify: FastifyInstance,
  options: MetricsRouteOptions,
): void {
  const { path = '/metrics', collection, loadMetricsFn, errorMessagePrefix } = options;

  fastify.get(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    try {
      const metrics = await loadMetricsFn(request);
      return reply.send({ metrics });
    } catch {
      return sendDatabaseError(reply, `Failed to load ${errorMessagePrefix} metrics`);
    }
  });
}

export interface CountRouteOptions {
  path?: string;
  collection: string;
  loadAllFn: () => Promise<unknown[]>;
  errorMessagePrefix: string;
}

/**
 * Registers a standard count endpoint with RBAC checks.
 */
export function registerCountRoute(
  fastify: FastifyInstance,
  options: CountRouteOptions,
): void {
  const { path = '/count', collection, loadAllFn, errorMessagePrefix } = options;

  fastify.get(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    try {
      const items = await loadAllFn();
      return reply.send({ count: items.length });
    } catch {
      return sendDatabaseError(reply, `Failed to count ${errorMessagePrefix}`);
    }
  });
}

export interface ResolveRouteOptions {
  path?: string;
  collection: string;
  loadByIdsFn: (ids: string[], request: FastifyRequest) => Promise<unknown[]>;
  responseKey: string;
  errorMessagePrefix: string;
}

/**
 * Registers a standard resolve endpoint with RBAC checks.
 */
export function registerResolveRoute(
  fastify: FastifyInstance,
  options: ResolveRouteOptions,
): void {
  const { path = '/resolve', collection, loadByIdsFn, responseKey, errorMessagePrefix } = options;

  fastify.post(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    const parsed = parseRequest(entityResolveBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const items = await loadByIdsFn(parsed.data.ids, request);
      return reply.send({ [responseKey]: items });
    } catch {
      return sendDatabaseError(reply, `Failed to resolve ${errorMessagePrefix}`);
    }
  });
}

export interface WidgetAggregatesRouteOptions {
  path?: string;
  collection: string;
  loadAggregatesFn: (widgets: WidgetQuery[]) => Promise<unknown>;
  errorMessagePrefix: string;
}

/**
 * Registers a standard widget aggregates endpoint with RBAC checks.
 */
export function registerWidgetAggregatesRoute(
  fastify: FastifyInstance,
  options: WidgetAggregatesRouteOptions,
): void {
  const { path = '/widget-aggregates', collection, loadAggregatesFn, errorMessagePrefix } = options;

  fastify.post(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    const parsed = parseRequest(widgetAggregatesBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const results = await loadAggregatesFn(parsed.data.widgets);
      return reply.send({ results });
    } catch {
      return sendDatabaseError(reply, `Failed to load ${errorMessagePrefix} widget aggregates`);
    }
  });
}

export interface LinkedContactIdsRouteOptions {
  path?: string;
  collection: string;
  loadLinkedContactIdsFn: (excludeId?: string) => Promise<(string | number)[]>;
  errorMessagePrefix: string;
}

const linkedContactIdsQuerySchema = z.object({
  excludeId: z.string().optional(),
});

/**
 * Registers a standard linked contact IDs endpoint with RBAC checks.
 */
export function registerLinkedContactIdsRoute(
  fastify: FastifyInstance,
  options: LinkedContactIdsRouteOptions,
): void {
  const { path = '/linked-contact-ids', collection, loadLinkedContactIdsFn, errorMessagePrefix } = options;

  fastify.get(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    const parsed = parseRequest(linkedContactIdsQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const contactIds = await loadLinkedContactIdsFn(parsed.data.excludeId);
      return reply.send({ contactIds });
    } catch {
      return sendDatabaseError(reply, `Failed to load linked contact ids for ${errorMessagePrefix}`);
    }
  });
}

export interface BulkPutRouteOptions<T> {
  path?: string;
  collection: string;
  schema: ZodType<T>;
  saveFn: (data: T) => Promise<unknown>;
  responseKey: string;
  errorMessagePrefix: string;
}

/**
 * Registers a bulk PUT endpoint with standard RBAC, validation, and error handling.
 */
export function registerBulkPutRoute<T>(
  fastify: FastifyInstance,
  options: BulkPutRouteOptions<T>,
): void {
  const { path = '/bulk', collection, schema, saveFn, responseKey, errorMessagePrefix } = options;

  fastify.put(path, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, collection)) return sendForbidden(reply);
    const parsed = parseRequest(schema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const updated = await saveFn(parsed.data);
      return reply.send({ [responseKey]: updated });
    } catch {
      return sendDatabaseError(reply, `Failed to replace ${errorMessagePrefix}`);
    }
  });
}

export interface PaginatedListRouteOptions<TQuery, TPageResult, TAllResult = unknown[]> {
  path?: string;
  collection: string;
  schema: ZodType<TQuery>;
  loadPageFn: (query: TQuery & { includeDeleted: boolean }) => Promise<TPageResult>;
  defaultPageSize: number;
  errorMessagePrefix: string;
  canWriteDeletedCheck?: (user: User) => boolean;
  responseTransform?: (result: TPageResult | TAllResult, user: User) => Promise<unknown> | unknown;
  loadAllFn?: (options: { includeDeleted: boolean }) => Promise<TAllResult>;
}

export function registerPaginatedListRoute<
  TQuery extends { page?: number; limit?: number; includeDeleted?: string },
  TPageResult,
  TAllResult = unknown[],
>(
  fastify: FastifyInstance,
  options: PaginatedListRouteOptions<TQuery, TPageResult, TAllResult>,
): void {
  const {
    path,
    collection,
    schema,
    loadPageFn,
    defaultPageSize,
    errorMessagePrefix,
    canWriteDeletedCheck,
    responseTransform,
    loadAllFn,
  } = options;

  fastify.get(path || '/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);
    const queryParsed = parseRequest(schema, request.query);
    if (!queryParsed.ok) return replyValidationError(reply, queryParsed.message);
    try {
      const query = queryParsed.data;
      const includeDeleted = query.includeDeleted === 'true';
      if (includeDeleted) {
        const allowed = canWriteDeletedCheck
          ? canWriteDeletedCheck(user)
          : canWriteCollection(user, collection);
        if (!allowed) return sendForbidden(reply);
      }

      if (query.page != null) {
        const page = await loadPageFn({
          ...query,
          limit: query.limit ?? defaultPageSize,
          includeDeleted,
        });
        const responseData = responseTransform ? await responseTransform(page, user) : page;
        return reply.send(responseData);
      }

      if (loadAllFn) {
        const all = await loadAllFn({ includeDeleted });
        const responseData = responseTransform ? await responseTransform(all, user) : all;
        return reply.send({ [errorMessagePrefix]: responseData });
      }

      // If page is null and loadAllFn is not defined, execute page = 1 by default
      const page = await loadPageFn({
        ...query,
        page: 1,
        limit: defaultPageSize,
        includeDeleted,
      });
      const responseData = responseTransform ? await responseTransform(page, user) : page;
      return reply.send(responseData);
    } catch {
      return sendDatabaseError(reply, `Failed to list ${errorMessagePrefix}`);
    }
  });
}

export interface StandardExtendedRoutesOptions<TQuery, TRecord> {
  prefix?: string;
  collection: string;
  listQuerySchema?: ZodType<TQuery>;
  defaultPageSize?: number;
  errorMessagePrefix: string;
  nameSingular: string;
  loadPageFn?: (query: TQuery & { includeDeleted: boolean }) => Promise<any>;
  loadAllFn: (options?: { includeDeleted?: boolean }) => Promise<TRecord[]>;
  computeMetricsFn?: (records: TRecord[], request: FastifyRequest) => Promise<any> | any;
  loadWidgetAggregatesFn?: (queries: any[]) => Promise<any>;
  loadByIdsFn?: (ids: string[]) => Promise<TRecord[]>;
  loadLinkedContactIdsFn?: (excludeId?: string) => Promise<(string | number)[]>;
  columnPreferencesObjectKey?: string;
}

/**
 * Registers standard extended routes (Paginated List, Count, Metrics, Widget Aggregates, Resolve, Linked Contact IDs, Column Preferences).
 */
export function registerStandardExtendedRoutes<
  TQuery extends { page?: number; limit?: number; includeDeleted?: string } = any,
  TRecord = any,
>(
  fastify: FastifyInstance,
  options: StandardExtendedRoutesOptions<TQuery, TRecord>,
): void {
  const {
    prefix,
    collection,
    listQuerySchema,
    defaultPageSize,
    errorMessagePrefix,
    nameSingular,
    loadPageFn,
    loadAllFn,
    computeMetricsFn,
    loadWidgetAggregatesFn,
    loadByIdsFn,
    columnPreferencesObjectKey,
    loadLinkedContactIdsFn,
  } = options;

  if (listQuerySchema && loadPageFn) {
    registerPaginatedListRoute(fastify, {
      path: prefix || '/',
      collection,
      schema: listQuerySchema,
      defaultPageSize: defaultPageSize ?? 20,
      errorMessagePrefix,
      loadPageFn,
    });
  }

  registerCountRoute(fastify, {
    path: prefix ? `${prefix}/count` : '/count',
    collection,
    loadAllFn: () => loadAllFn(),
    errorMessagePrefix,
  });

  if (computeMetricsFn) {
    registerMetricsRoute(fastify, {
      path: prefix ? `${prefix}/metrics` : '/metrics',
      collection,
      loadMetricsFn: async (request) => {
        const records = await loadAllFn();
        return computeMetricsFn(records, request);
      },
      errorMessagePrefix: nameSingular,
    });
  }

  if (loadWidgetAggregatesFn) {
    registerWidgetAggregatesRoute(fastify, {
      path: prefix ? `${prefix}/widget-aggregates` : '/widget-aggregates',
      collection,
      loadAggregatesFn: loadWidgetAggregatesFn,
      errorMessagePrefix: nameSingular,
    });
  }

  if (loadByIdsFn) {
    registerResolveRoute(fastify, {
      path: prefix ? `${prefix}/resolve` : '/resolve',
      collection,
      loadByIdsFn: loadByIdsFn,
      responseKey: errorMessagePrefix,
      errorMessagePrefix,
    });
  }

  if (loadLinkedContactIdsFn) {
    registerLinkedContactIdsRoute(fastify, {
      path: prefix ? `${prefix}/linked-contact-ids` : '/linked-contact-ids',
      collection,
      loadLinkedContactIdsFn,
      errorMessagePrefix,
    });
  }

  if (columnPreferencesObjectKey) {
    registerColumnPreferencesRoutes(fastify, {
      path: prefix ? `${prefix}/column-preferences` : '/column-preferences',
      collection,
      objectKey: columnPreferencesObjectKey,
    });
  }
}

export interface StandardTenantRoutesOptions<TQuery, TRecord extends ResourceRecord>
  extends StandardExtendedRoutesOptions<TQuery, TRecord> {
  schema: ZodType<TRecord>;
  loadByIdFn?: (id: string, includeDeleted?: boolean) => Promise<unknown | null>;
  createFn?: (data: TRecord) => Promise<unknown>;
  updateFn?: (id: string, data: TRecord) => Promise<unknown | null>;
  deleteFn?: (id: string, userId: string, reason?: string) => Promise<unknown | null>;
  restoreFn?: (id: string) => Promise<unknown | null>;
  namePlural: string;
  customPostRoute?: boolean;
  customPutRoute?: boolean;
}

/**
 * Registers all standard tenant routes (Standard Extended + CRUD).
 */
export function registerStandardTenantRoutes<
  TQuery extends { page?: number; limit?: number; includeDeleted?: string } = any,
  TRecord extends ResourceRecord = any,
>(
  fastify: FastifyInstance,
  options: StandardTenantRoutesOptions<TQuery, TRecord>,
): void {
  const {
    prefix,
    collection,
    listQuerySchema,
    defaultPageSize,
    errorMessagePrefix,
    nameSingular,
    namePlural,
    loadPageFn,
    loadAllFn,
    computeMetricsFn,
    loadWidgetAggregatesFn,
    loadByIdsFn,
    columnPreferencesObjectKey,
    loadLinkedContactIdsFn,
    schema,
    loadByIdFn,
    createFn,
    updateFn,
    deleteFn,
    restoreFn,
    customPostRoute,
    customPutRoute,
  } = options;

  registerStandardExtendedRoutes(fastify, {
    prefix,
    collection,
    listQuerySchema,
    defaultPageSize,
    errorMessagePrefix,
    nameSingular,
    loadPageFn,
    loadAllFn,
    computeMetricsFn,
    loadWidgetAggregatesFn,
    loadByIdsFn,
    columnPreferencesObjectKey,
    loadLinkedContactIdsFn,
  });

  const hasPaginatedListRoute = !!(listQuerySchema && loadPageFn);

  registerResourceRoutes(fastify, {
    prefix,
    customGetRoute: hasPaginatedListRoute,
    customPostRoute,
    customPutRoute,
    collection,
    schema,
    loadByIdFn,
    createFn,
    updateFn,
    deleteFn,
    restoreFn,
    nameSingular,
    namePlural,
  });
}

