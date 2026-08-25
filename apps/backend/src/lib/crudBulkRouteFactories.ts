import type { FastifyInstance } from 'fastify';
import type { ZodType } from 'zod';

import type { User } from '@mms/shared';
import { canDeleteCollection, canWriteCollection } from './rbacCanHelpers.js';
import { sendForbidden, sendDatabaseError, sendNotFound } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';
import { bulkIdsBodySchema } from '../validation/commonSchemas.js';
import {
  handleBulkListGet,
  type BulkRoutesOptions,
  type SoftDeletableBulkRoutesOptions,
  type SoftDeletableBulkTrashRoutesOptions,
} from './crudBulkRouteHelpers.js';

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
    customGetRoute,
  } = options;

  if (!customGetRoute && loadFn) {
    fastify.get(path, async (request, reply) => {
      return handleBulkListGet(request, reply, request.user as User, collection, {
        loadFn,
        loadPageFn,
        listQuerySchema,
        defaultPageSize,
        responseKey,
        errorMessagePrefix,
      });
    });
  }

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
    loadFn?: (options?: { includeDeleted?: boolean }) => Promise<unknown>;
    loadPageFn?: (query: any) => Promise<unknown>;
    /** When provided, the GET branch validates the full query (page/limit/search/sort/filters) and forwards it to `loadPageFn`. */
    listQuerySchema?: ZodType;
    /** Fallback page size when the client omits `limit` (schema path). */
    defaultPageSize?: number;
    saveFn: (data: T) => Promise<unknown>;
    responseKey: string;
    errorMessagePrefix: string;
    customGetRoute?: boolean;
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
    customGetRoute,
  } = options;

  const bulkPath = path === '/' ? '/bulk' : `${path}/bulk`;

  if (!customGetRoute && loadFn) {
    fastify.get(path, async (request, reply) => {
      return handleBulkListGet(request, reply, request.user as User, collection, {
        loadFn,
        loadPageFn,
        listQuerySchema,
        defaultPageSize,
        responseKey,
        errorMessagePrefix,
        supportsIncludeDeleted: true,
      });
    });
  }

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
}

/**
 * Registers only POST `/bulk-delete` + `/bulk-restore` (Contacts/Students + soft-deletable modules).
 * Use when single delete/restore are registered elsewhere (standard tenant routes / custom handlers).
 */
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
  options: SoftDeletableBulkRoutesOptions<T> & { customGetRoute?: boolean; customBulkTrashRoutes?: boolean },
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
    bulkBodySchema = bulkIdsBodySchema,
    mapDeleteError,
    customGetRoute,
    customBulkTrashRoutes,
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
    customGetRoute,
  });

  // Static bulk paths before /:id to avoid parametric capture.
  if (!customBulkTrashRoutes) {
    registerSoftDeletableBulkTrashRoutes(fastify, {
      path,
      collection,
      errorMessagePrefix,
      bulkBodySchema,
      bulkDeleteFn,
      bulkRestoreFn: (ids) => bulkRestoreFn(ids),
    });
  }

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
}
