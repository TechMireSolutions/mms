import { FastifyInstance } from 'fastify';
import { z, type ZodType } from 'zod';

import type { User } from '@mms/shared';
import { canDeleteCollection, canReadCollection, canWriteCollection } from './rbacCanHelpers.js';
import { sendForbidden, sendDatabaseError, sendNotFound, sendConflict } from './httpErrors.js';
import { parseRequest, replyValidationError, executeDynamicValidation } from './zodRequest.js';
import {
  resourceIdParamsSchema,
  softDeleteBodySchema,
} from '../validation/commonSchemas.js';
import type { ResourceRecord } from './crudRouterTypes.js';
import type { SoftDeleteRouteErrorMapper } from './crudBulkRoutes.js';

export interface ResourceRoutesOptions<T extends ResourceRecord> {
  prefix?: string;
  collection: string;
  schema: ZodType<T>;
  /** Tenant-aware strict write schema (system keys ∪ Setup custom keys). POST/PUT use it when set. */
  buildWriteSchema?: () => Promise<ZodType<T>>;
  loadAllFn?: () => Promise<unknown[]>;
  loadByIdFn?: (id: string, includeDeleted?: boolean) => Promise<unknown | null>;
  createFn?: (data: T) => Promise<unknown>;
  updateFn?: (id: string, data: T) => Promise<unknown | null>;
  deleteFn?: (id: string, userId: string, reason?: string) => Promise<unknown | null>;
  /** Soft-restore; `userId` is the acting user (Contacts uniqueness/audit actors). */
  restoreFn?: (id: string, userId: string) => Promise<unknown | null>;
  nameSingular: string;
  namePlural: string;
  customGetRoute?: boolean;
  customGetSingleRoute?: boolean;
  customPostRoute?: boolean;
  customPutRoute?: boolean;
  validateDynamicFn?: (tenant: string, data: T, lang: string, user: User) => Promise<void>;
  /** Override collection delete capability (defaults to canDeleteCollection). */
  canDelete?: (user: User) => boolean;
  /** Optional post-create audit hook. */
  onAfterCreate?: (user: User, item: unknown) => Promise<void>;
  /** Optional post-update audit hook. */
  onAfterUpdate?: (user: User, id: string, updated: unknown) => Promise<void>;
  /** Optional post-soft-delete audit hook (Students SSOT with Contacts). */
  onAfterDelete?: (
    user: User,
    id: string,
    deletionReason?: string,
  ) => Promise<void>;
  /** Optional post-restore audit hook. */
  onAfterRestore?: (user: User, id: string) => Promise<void>;
  /** Replace default `{ success: true }` restore payload (Contacts returns sanitized entity). */
  buildRestoreResponse?: (
    restored: unknown,
    user: User,
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** Transform single-entity responses (GET /:id, POST, PUT) — used for viewer-role sanitization. */
  buildSingleResponse?: (item: unknown, user: User) => Promise<unknown> | unknown;
  /** Map domain restore failures (e.g. unique field conflicts) to HTTP replies. */
  mapRestoreError?: SoftDeleteRouteErrorMapper;
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
    buildWriteSchema,
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
    validateDynamicFn,
    canDelete = (user) => canDeleteCollection(user, collection),
    onAfterCreate,
    onAfterUpdate,
    onAfterDelete,
    onAfterRestore,
    buildRestoreResponse,
    buildSingleResponse,
    mapRestoreError,
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
          return sendNotFound(reply, `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found`);
        }
        const response = buildSingleResponse ? await buildSingleResponse(item, user) : item;
        return reply.send({ [nameSingular]: response });
      } catch {
        return sendDatabaseError(reply, `Failed to load ${nameSingular}`);
      }
    });
  }


  // POST / or POST /prefix
  if (!customPostRoute && createFn) {
    const routeOptions = validateDynamicFn
      ? {
          bodyLimit: 1048576,
          schema: { body: z.record(z.string(), z.any()) },
        }
      : {};

    fastify.post(prefix || '/', routeOptions, async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const writeSchema = buildWriteSchema ? await buildWriteSchema() : schema;
      const parsed = parseRequest(writeSchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      if (validateDynamicFn) {
        const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
          validateDynamicFn(tenant, parsed.data, lang, user)
        );
        if (!isValid) return;
      }

      try {
        const item = await createFn(parsed.data);
        await onAfterCreate?.(user, item);
        const response = buildSingleResponse ? await buildSingleResponse(item, user) : item;
        return reply.status(201).send({ [nameSingular]: response });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : `Failed to create ${nameSingular}`;
        const statusCode =
          typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          typeof (error as { statusCode: unknown }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 0;
        if (statusCode === 409) return sendConflict(reply, errMsg);
        return sendDatabaseError(reply, errMsg);
      }
    });
  }

  // PUT /:id or PUT /prefix/:id
  if (!customPutRoute && updateFn) {
    const routeOptions = validateDynamicFn
      ? {
          bodyLimit: 1048576,
          schema: { body: z.record(z.string(), z.any()), params: resourceIdParamsSchema },
        }
      : {};

    fastify.put(`${prefix}/:id`, routeOptions, async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      const writeSchema = buildWriteSchema ? await buildWriteSchema() : schema;
      const body = parseRequest(writeSchema, request.body);
      if (!params.ok) return replyValidationError(reply, params.message);
      if (!body.ok) return replyValidationError(reply, body.message);

      if (validateDynamicFn) {
        const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
          validateDynamicFn(tenant, body.data, lang, user)
        );
        if (!isValid) return;
      }

      try {
        const updated = await updateFn(params.data.id, {
          ...body.data,
          id: body.data.id ?? params.data.id,
        });
        if (!updated) {
          return sendNotFound(reply, `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found`);
        }
        await onAfterUpdate?.(user, params.data.id, updated);
        const response = buildSingleResponse ? await buildSingleResponse(updated, user) : updated;
        return reply.send({ [nameSingular]: response });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : `Failed to update ${nameSingular}`;
        const statusCode =
          typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          typeof (error as { statusCode: unknown }).statusCode === 'number'
            ? (error as { statusCode: number }).statusCode
            : 0;
        if (statusCode === 409) return sendConflict(reply, errMsg);
        return sendDatabaseError(reply, errMsg);
      }
    });
  }

  // DELETE /:id or DELETE /prefix/:id
  if (deleteFn) {
    fastify.delete<{ Params: { id: string } }>(`${prefix}/:id`, async (request, reply) => {
      const user = request.user as User;
      if (!canDelete(user)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      const body = parseRequest(softDeleteBodySchema, request.body ?? {});
      if (!body.ok) return replyValidationError(reply, body.message);
      try {
        const deleted = await deleteFn(params.data.id, String(user.id), body.data.deletionReason);
        if (!deleted) {
          return sendNotFound(reply, `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found`);
        }
        await onAfterDelete?.(user, params.data.id, body.data.deletionReason);
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
      if (!canDelete(user)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      try {
        const restored = await restoreFn(params.data.id, String(user.id));
        if (!restored) {
          return sendNotFound(reply, `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found or not deleted`);
        }
        await onAfterRestore?.(user, params.data.id);
        const payload = buildRestoreResponse
          ? await buildRestoreResponse(restored, user)
          : { success: true };
        return reply.send(payload);
      } catch (error: unknown) {
        const mapped = mapRestoreError?.(error);
        if (mapped) {
          return reply.status(mapped.statusCode).send(mapped.body);
        }
        return sendDatabaseError(reply, `Failed to restore ${nameSingular}`);
      }
    });
  }
}
