import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  USERS_MODULE_MANIFEST,
  workspaceUserListSchema,
  activityLogListSchema,
} from '@mms/shared';
import type { User } from '@mms/shared';
import {
  registerBulkRoutes,
  registerSoftDeletableBulkTrashRoutes,
  registerPaginatedListRoute,
  registerCountRoute,
  registerMetricsRoute,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { canDeleteCollection, canWriteCollection } from '../../services/rbacService.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';
import { bulkStringIdsBodySchema } from '../../validation/commonSchemas.js';
import { usersListQuerySchema } from '../../validation/userSchemas.js';

import {
  upsertWorkspaceUsers,
  loadLogs,
  upsertLogs,
  deleteUserById,
  restoreUserById,
  bulkSoftDeleteUsers,
  bulkRestoreUsers,
  loadUsersPage,
  countUsers,
  loadUsersCommandMetrics,
} from '../../services/usersService.js';
import { userExportRoutes } from './users/userExportRoutes.js';
import { userSetupConfigRoutes } from './users/userSetupConfigRoutes.js';

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

  await fastify.register(userSetupConfigRoutes);
  await fastify.register(userExportRoutes);

  registerMetricsRoute(fastify, {
    collection: USERS_COLLECTION,
    errorMessagePrefix: 'workspace users',
    loadMetricsFn: loadUsersCommandMetrics,
  });

  registerCountRoute(fastify, {
    path: '/count',
    collection: USERS_COLLECTION,
    loadCountFn: countUsers,
    errorMessagePrefix: 'workspace users',
  });

  registerPaginatedListRoute(fastify, {
    collection: USERS_COLLECTION,
    schema: usersListQuerySchema,
    defaultPageSize: USERS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'users',
    canWriteDeletedCheck: (user) => canDeleteCollection(user, USERS_COLLECTION),
    loadPageFn: (query) => loadUsersPage(query),
  });

  fastify.put('/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(workspaceUserListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const updated = await upsertWorkspaceUsers(parsed.data);
      return reply.send({ users: updated });
    } catch {
      return sendDatabaseError(reply, 'Failed to update workspace users');
    }
  });

  registerSoftDeletableBulkTrashRoutes(fastify, {
    collection: USERS_COLLECTION,
    errorMessagePrefix: 'workspace users',
    bulkBodySchema: bulkStringIdsBodySchema,
    bulkDeleteFn: bulkSoftDeleteUsers,
    bulkRestoreFn: bulkRestoreUsers,
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
