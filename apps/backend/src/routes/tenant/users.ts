import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteCollection, canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import {
  USERS_MODULE_MANIFEST,
  workspaceUserListSchema,
  activityLogListSchema,
  type User,
} from '@mms/shared';
import { registerBulkRoutes } from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';
import {
  includeDeletedQuerySchema,
  bulkStringIdsBodySchema,
} from '../../validation/commonSchemas.js';

import {
  loadWorkspaceUsers,
  upsertWorkspaceUsers,
  loadLogs,
  upsertLogs,
  deleteUserById,
  restoreUserById,
  bulkSoftDeleteUsers,
  bulkRestoreUsers,
} from '../../services/usersService.js';

const USERS_COLLECTION = USERS_MODULE_MANIFEST.collectionKey;
const LOGS_COLLECTION = 'user_activity_logs';

/**
 * Users module routes — workspace users CRUD, soft-delete, activity logs, column preferences.
 */
export default async function usersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(includeDeletedQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const includeDeleted = parsed.data.includeDeleted === 'true';
    if (includeDeleted && !canDeleteCollection(user, USERS_COLLECTION)) {
      return sendForbidden(reply);
    }
    try {
      const users = await loadWorkspaceUsers({ includeDeleted });
      return reply.send({ users });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load workspace users', error);
    }
  });

  fastify.put('/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(workspaceUserListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const users = await upsertWorkspaceUsers(parsed.data);
      return reply.send({ users });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to update workspace users', error);
    }
  });

  // Static bulk paths before /:id to avoid parametric capture.
  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkStringIdsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkSoftDeleteUsers(parsed.data.ids, String(user.id));
      return reply.send({ success: true, ...result });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to bulk delete users', error);
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(bulkStringIdsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await bulkRestoreUsers(parsed.data.ids);
      return reply.send({ success: true, ...result });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to bulk restore users', error);
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await deleteUserById(request.params.id, String(user.id));
      if (!ok) return sendNotFound(reply, 'User not found');
      return reply.send({ success: true });
    } catch (error: unknown) {
      if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 400) {
        return reply.status(400).send({
          type: (error as Error & { type?: string }).type,
          message: error.message,
        });
      }
      return sendDatabaseError(reply, 'Failed to delete user', error);
    }
  });

  fastify.post<{ Params: { id: string } }>('/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    try {
      const ok = await restoreUserById(request.params.id);
      if (!ok) return sendNotFound(reply, 'User not found');
      return reply.send({ success: true });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to restore user', error);
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/column-preferences',
    collection: USERS_COLLECTION,
    objectKey: USERS_MODULE_MANIFEST.columnPreferencesObjectKey,
  });

  registerBulkRoutes(fastify, {
    path: '/activity',
    collection: LOGS_COLLECTION,
    schema: activityLogListSchema,
    loadFn: loadLogs,
    saveFn: upsertLogs,
    responseKey: 'logs',
    errorMessagePrefix: 'activity logs',
  });
}
