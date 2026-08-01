import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  USERS_MODULE_MANIFEST,
  computeUsersCommandMetrics,
  workspaceUserListSchema,
  activityLogListSchema,
} from '@mms/shared';
import { registerBulkRoutes, registerSoftDeletableBulkRoutes } from '../../lib/crudRouter.js';
import { registerMetricsRoute } from '../../lib/crudQueryRoutes.js';
import { bulkStringIdsBodySchema } from '../../validation/commonSchemas.js';

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

  registerMetricsRoute(fastify, {
    collection: USERS_COLLECTION,
    errorMessagePrefix: 'workspace users',
    loadMetricsFn: async () => {
      const users = await loadWorkspaceUsers();
      return computeUsersCommandMetrics(users);
    },
  });

  registerSoftDeletableBulkRoutes(fastify, {
    path: '/',
    collection: USERS_COLLECTION,
    schema: workspaceUserListSchema,
    loadFn: loadWorkspaceUsers,
    saveFn: upsertWorkspaceUsers,
    deleteFn: deleteUserById,
    restoreFn: restoreUserById,
    bulkDeleteFn: bulkSoftDeleteUsers,
    bulkRestoreFn: bulkRestoreUsers,
    responseKey: 'users',
    errorMessagePrefix: 'workspace users',
    nameSingular: 'User',
    columnPreferencesObjectKey: USERS_MODULE_MANIFEST.columnPreferencesObjectKey,
    bulkBodySchema: bulkStringIdsBodySchema,
    mapDeleteError: (error) => {
      if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 400) {
        return {
          statusCode: 400,
          body: {
            type: (error as Error & { type?: string }).type,
            message: error.message,
          },
        };
      }
      return null;
    },
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
