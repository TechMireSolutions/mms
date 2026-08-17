import type { FastifyInstance } from 'fastify';
import type { ZodType } from 'zod';

import { isQueryFlagTrue, type User } from '@mms/shared';
import { canDeleteCollection, canReadCollection, canWriteCollection } from './rbacCanHelpers.js';
import { sendForbidden, sendDatabaseError, sendNotFound } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';
import {
  includeDeletedQuerySchema,
  bulkIdsBodySchema,
} from '../validation/commonSchemas.js';
import { registerColumnPreferencesRoutes } from './columnPreferencesRouter.js';

export interface BulkRoutesOptions<T> {
  path: string;
  collection: string;
  schema: ZodType<T>;
  loadFn: () => Promise<unknown>;
  loadPageFn?: (query: any) => Promise<unknown>;
  /** When provided, the GET branch validates the full query (page/limit/search/sort/filters) and forwards it to `loadPageFn`. */
  listQuerySchema?: ZodType;
  /** Fallback page size when the client omits `limit` (schema path). */
  defaultPageSize?: number;
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
    loadPageFn,
    listQuerySchema,
    defaultPageSize,
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
      let pageQuery: Record<string, unknown> | undefined;
      if (listQuerySchema) {
        const parsed = parseRequest(listQuerySchema, request.query);
        if (!parsed.ok) return replyValidationError(reply, parsed.message);
        const query = parsed.data as Record<string, unknown>;
        if (query.page != null && loadPageFn) pageQuery = query;
      } else {
        const queryParams = request.query as Record<string, string>;
        const isPaginated = !!(queryParams.page || queryParams.limit || queryParams.sortField);
        if (isPaginated && loadPageFn) {
          const page = parseInt(queryParams.page || '1', 10);
          const limit = parseInt(queryParams.limit || '50', 10);
          const data = await loadPageFn({
            page,
            limit,
            search: queryParams.search,
            sortField: queryParams.sortField,
            sortDir: queryParams.sortDir as 'asc' | 'desc',
          });
          return reply.send(data);
        }
      }

      if (pageQuery && loadPageFn) {
        const data = await loadPageFn({
          ...pageQuery,
          limit: pageQuery.limit ?? defaultPageSize,
        });
        return reply.send(data);
      }

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

export type SoftDeleteRouteErrorMapper = (
  error: unknown,
) => { statusCode: number; body: Record<string, unknown> } | null;

export interface SoftDeletableBulkRoutesOptions<T> {
  path: string;
  collection: string;
  schema: ZodType<T>;
  loadFn: (options?: { includeDeleted?: boolean }) => Promise<unknown>;
  loadPageFn?: (query: any) => Promise<unknown>;
  /** When provided, the GET branch validates the full query (page/limit/search/sort/filters) and forwards it to `loadPageFn`. */
  listQuerySchema?: ZodType;
  /** Fallback page size when the client omits `limit` (schema path). */
  defaultPageSize?: number;
  saveFn: (data: T) => Promise<unknown>;
  deleteFn: (id: string, userId: string, reason?: string) => Promise<boolean | null | unknown>;
  restoreFn: (id: string) => Promise<boolean | null | unknown>;
  bulkDeleteFn: (
    ids: string[],
    userId: string,
    reason?: string,
  ) => Promise<{ succeeded: number; failed: number }>;
  bulkRestoreFn: (ids: string[]) => Promise<{ succeeded: number; failed: number }>;
  responseKey: string;
  errorMessagePrefix: string;
  nameSingular: string;
  columnPreferencesObjectKey?: string;
  columnPreferencesPath?: string;
  /** Defaults to {@link bulkIdsBodySchema}; use string-only schemas when needed. */
  bulkBodySchema?: ZodType<{ ids: Array<string | number>; deletionReason?: string }>;
  /** Map domain delete failures (e.g. posted entries, self-delete) to stable HTTP responses. */
  mapDeleteError?: SoftDeleteRouteErrorMapper;
}

/**
 * Registers GET(+trash)/PUT bulk for collections that support `includeDeleted`
 * without exposing soft-delete/restore endpoints.
 */
export function registerIncludableBulkRoutes<T>(
  fastify: FastifyInstance,
  options: {
    path: string;
    collection: string;
    schema: ZodType<T>;
    loadFn: (options?: { includeDeleted?: boolean }) => Promise<unknown>;
    loadPageFn?: (query: any) => Promise<unknown>;
    /** When provided, the GET branch validates the full query (page/limit/search/sort/filters) and forwards it to `loadPageFn`. */
    listQuerySchema?: ZodType;
    /** Fallback page size when the client omits `limit` (schema path). */
    defaultPageSize?: number;
    saveFn: (data: T) => Promise<unknown>;
    responseKey: string;
    errorMessagePrefix: string;
    columnPreferencesObjectKey?: string;
    columnPreferencesPath?: string;
  },
): void {
  const {
    path,
    collection,
    schema,
    loadFn,
    loadPageFn,
    listQuerySchema,
    defaultPageSize,
    saveFn,
    responseKey,
    errorMessagePrefix,
    columnPreferencesObjectKey,
    columnPreferencesPath,
  } = options;

  const bulkPath = path === '/' ? '/bulk' : `${path}/bulk`;

  fastify.get(path, async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, collection)) return sendForbidden(reply);

    let includeDeleted: boolean;
    let pageQuery: Record<string, unknown> | undefined;
    if (listQuerySchema) {
      const parsed = parseRequest(listQuerySchema, request.query);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const query = parsed.data as Record<string, unknown>;
      includeDeleted = isQueryFlagTrue(query.includeDeleted);
      if (query.page != null && loadPageFn) pageQuery = query;
    } else {
      const parsed = parseRequest(includeDeletedQuerySchema, request.query);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      includeDeleted = isQueryFlagTrue(parsed.data.includeDeleted);
    }

    if (includeDeleted && !canDeleteCollection(user, collection)) {
      return sendForbidden(reply);
    }

    try {
      if (pageQuery && loadPageFn) {
        const data = await loadPageFn({
          ...pageQuery,
          limit: pageQuery.limit ?? defaultPageSize,
          includeDeleted,
        });
        return reply.send(data);
      }

      if (!listQuerySchema) {
        const queryParams = request.query as Record<string, string>;
        const isPaginated = !!(queryParams.page || queryParams.limit || queryParams.sortField);
        if (isPaginated && loadPageFn) {
          const page = parseInt(queryParams.page || '1', 10);
          const limit = parseInt(queryParams.limit || '50', 10);
          const data = await loadPageFn({
            page,
            limit,
            search: queryParams.search,
            sortField: queryParams.sortField,
            sortDir: queryParams.sortDir as 'asc' | 'desc',
            includeDeleted,
          });
          return reply.send(data);
        }
      }

      const data = await loadFn({ includeDeleted });
      return reply.send({ [responseKey]: data });
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to load ${errorMessagePrefix}`, error);
    }
  });

  fastify.put(bulkPath, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, collection)) return sendForbidden(reply);
    const parsed = parseRequest(schema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const updated = await saveFn(parsed.data);
      return reply.send({ [responseKey]: updated });
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to update ${errorMessagePrefix}`, error);
    }
  });

  if (columnPreferencesObjectKey) {
    registerColumnPreferencesRoutes(fastify, {
      path: columnPreferencesPath ?? `${path}/column-preferences`,
      collection,
      objectKey: columnPreferencesObjectKey,
    });
  }
}

/**
 * Registers only POST `/bulk-delete` + `/bulk-restore` (Contacts/Students + soft-deletable modules).
 * Use when single delete/restore are registered elsewhere (standard tenant routes / custom handlers).
 */
export type SoftDeletableBulkTrashRoutesOptions = {
  /** Route prefix; use `/` for module root (contacts/students plugins). */
  path?: string;
  collection: string;
  errorMessagePrefix: string;
  bulkBodySchema?: ZodType<{ ids: Array<string | number>; deletionReason?: string }>;
  bulkDeleteFn: (
    ids: string[],
    userId: string,
    reason?: string,
  ) => Promise<{ succeeded: number; failed: number }>;
  /** Second `userId` arg for modules that audit restore actor (Contacts). */
  bulkRestoreFn: (
    ids: string[],
    userId: string,
  ) => Promise<{ succeeded: number; failed: number }>;
  canDelete?: (user: User) => boolean;
  onAfterBulkDelete?: (
    user: User,
    result: { succeeded: number; failed: number },
    deletionReason?: string,
  ) => Promise<void>;
  onAfterBulkRestore?: (
    user: User,
    result: { succeeded: number; failed: number },
  ) => Promise<void>;
};

export function registerSoftDeletableBulkTrashRoutes(
  fastify: FastifyInstance,
  options: SoftDeletableBulkTrashRoutesOptions,
): void {
  const path = options.path ?? '/';
  const bulkDeletePath = path === '/' ? '/bulk-delete' : `${path}/bulk-delete`;
  const bulkRestorePath = path === '/' ? '/bulk-restore' : `${path}/bulk-restore`;
  const bulkBodySchema = options.bulkBodySchema ?? bulkIdsBodySchema;
  const canDelete =
    options.canDelete ?? ((user: User) => canDeleteCollection(user, options.collection));

  fastify.post(bulkDeletePath, async (request, reply) => {
    const user = request.user as User;
    if (!canDelete(user)) return sendForbidden(reply);
    const parsed = parseRequest(bulkBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const ids = parsed.data.ids.map(String);
      const result = await options.bulkDeleteFn(
        ids,
        String(user.id),
        parsed.data.deletionReason,
      );
      await options.onAfterBulkDelete?.(user, result, parsed.data.deletionReason);
      return reply.send({ success: true, ...result });
    } catch (error: unknown) {
      return sendDatabaseError(
        reply,
        `Failed to bulk delete ${options.errorMessagePrefix}`,
        error,
      );
    }
  });

  fastify.post(bulkRestorePath, async (request, reply) => {
    const user = request.user as User;
    if (!canDelete(user)) return sendForbidden(reply);
    const parsed = parseRequest(bulkBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const ids = parsed.data.ids.map(String);
      const result = await options.bulkRestoreFn(ids, String(user.id));
      await options.onAfterBulkRestore?.(user, result);
      return reply.send({ success: true, ...result });
    } catch (error: unknown) {
      return sendDatabaseError(
        reply,
        `Failed to bulk restore ${options.errorMessagePrefix}`,
        error,
      );
    }
  });
}

/**
 * Registers GET(+trash)/PUT bulk/soft-delete/restore for a soft-deletable collection.
 */
export function registerSoftDeletableBulkRoutes<T>(
  fastify: FastifyInstance,
  options: SoftDeletableBulkRoutesOptions<T>,
): void {
  const {
    path,
    collection,
    schema,
    loadFn,
    saveFn,
    deleteFn,
    restoreFn,
    bulkDeleteFn,
    bulkRestoreFn,
    responseKey,
    errorMessagePrefix,
    nameSingular,
    columnPreferencesObjectKey,
    columnPreferencesPath,
    bulkBodySchema = bulkIdsBodySchema,
    mapDeleteError,
  } = options;

  const idPath = path === '/' ? '/:id' : `${path}/:id`;
  const restorePath = path === '/' ? '/:id/restore' : `${path}/:id/restore`;

  registerIncludableBulkRoutes(fastify, {
    path,
    collection,
    schema,
    loadFn,
    loadPageFn: options.loadPageFn,
    listQuerySchema: options.listQuerySchema,
    defaultPageSize: options.defaultPageSize,
    saveFn,
    responseKey,
    errorMessagePrefix,
  });

  // Static bulk paths before /:id to avoid parametric capture.
  registerSoftDeletableBulkTrashRoutes(fastify, {
    path,
    collection,
    errorMessagePrefix,
    bulkBodySchema,
    bulkDeleteFn,
    bulkRestoreFn: (ids) => bulkRestoreFn(ids),
  });

  fastify.delete<{ Params: { id: string } }>(idPath, async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, collection)) return sendForbidden(reply);
    try {
      const ok = await deleteFn(request.params.id, String(user.id));
      if (!ok) return sendNotFound(reply, `${nameSingular} not found`);
      return reply.send({ success: true });
    } catch (error: unknown) {
      const mapped = mapDeleteError?.(error);
      if (mapped) return reply.status(mapped.statusCode).send(mapped.body);
      return sendDatabaseError(reply, `Failed to delete ${nameSingular.toLowerCase()}`, error);
    }
  });

  fastify.post<{ Params: { id: string } }>(restorePath, async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, collection)) return sendForbidden(reply);
    try {
      const ok = await restoreFn(request.params.id);
      if (!ok) return sendNotFound(reply, `${nameSingular} not found`);
      return reply.send({ success: true });
    } catch (error: unknown) {
      return sendDatabaseError(reply, `Failed to restore ${nameSingular.toLowerCase()}`, error);
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
