import { FastifyInstance } from 'fastify';
import type { ZodType } from 'zod';

import type { User } from '@mms/shared';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../services/rbacService.js';
import { sendForbidden, sendDatabaseError, sendNotFound } from './httpErrors.js';
import { parseRequest, replyValidationError, executeDynamicValidation } from './zodRequest.js';
import {
  resourceIdParamsSchema,
  softDeleteBodySchema,
} from '../validation/commonSchemas.js';
import { registerColumnPreferencesRoutes } from './columnPreferencesRouter.js';
import type { ResourceRecord } from './crudRouterTypes.js';

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
  validateDynamicFn?: (tenant: string, data: T, lang: string, user: User) => Promise<void>;
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
    validateDynamicFn,
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
        return reply.send({ [nameSingular]: item });
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
          schema: { body: { type: 'object', additionalProperties: true } },
        }
      : {};

    fastify.post(prefix || '/', routeOptions, async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const parsed = parseRequest(schema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      if (validateDynamicFn) {
        const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
          validateDynamicFn(tenant, parsed.data, lang, user)
        );
        if (!isValid) return;
      }

      try {
        const item = await createFn(parsed.data);
        return reply.status(201).send({ [nameSingular]: item });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : `Failed to create ${nameSingular}`;
        return sendDatabaseError(reply, errMsg);
      }
    });
  }

  // PUT /:id or PUT /prefix/:id
  if (!customPutRoute && updateFn) {
    const routeOptions = validateDynamicFn
      ? {
          bodyLimit: 1048576,
          schema: { body: { type: 'object', additionalProperties: true } },
        }
      : {};

    fastify.put(`${prefix}/:id`, routeOptions, async (request, reply) => {
      const user = request.user as User;
      if (!canWriteCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      const body = parseRequest(schema, request.body);
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
        return reply.send({ [nameSingular]: updated });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : `Failed to update ${nameSingular}`;
        return sendDatabaseError(reply, errMsg);
      }
    });
  }

  // DELETE /:id or DELETE /prefix/:id
  if (deleteFn) {
    fastify.delete<{ Params: { id: string } }>(`${prefix}/:id`, async (request, reply) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      const body = parseRequest(softDeleteBodySchema, request.body ?? {});
      if (!body.ok) return replyValidationError(reply, body.message);
      try {
        const deleted = await deleteFn(params.data.id, String(user.id), body.data.deletionReason);
        if (!deleted) {
          return sendNotFound(reply, `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found`);
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
      if (!canDeleteCollection(user, collection)) return sendForbidden(reply);
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      try {
        const restored = await restoreFn(params.data.id);
        if (!restored) {
          return sendNotFound(reply, `${nameSingular.charAt(0).toUpperCase() + nameSingular.slice(1)} not found or not deleted`);
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
