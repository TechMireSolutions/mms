import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  USERS_MODULE_CONTRACT,
  workspaceUserListSchema,
  activityLogListSchema,
} from '@mms/shared';
import { registerBulkRoutes } from '../../lib/crudRouter.js';

import {
  loadWorkspaceUsers,
  replaceWorkspaceUsers,
  loadLogs,
  replaceLogs,
} from '../../services/usersService.js';

const USERS_COLLECTION = USERS_MODULE_CONTRACT.collectionKey;
const LOGS_COLLECTION = 'user_activity_logs';

/**
 * Users module routes — workspace users CRUD, activity logs, and column preferences.
 */
export default async function usersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  // --- Users ---
  // --- Users ---
  registerBulkRoutes(fastify, {
    path: '/',
    collection: USERS_COLLECTION,
    schema: workspaceUserListSchema,
    loadFn: loadWorkspaceUsers,
    saveFn: replaceWorkspaceUsers,
    responseKey: 'users',
    errorMessagePrefix: 'workspace users',
    columnPreferencesObjectKey: USERS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  // --- Activity Logs ---
  registerBulkRoutes(fastify, {
    path: '/activity',
    collection: LOGS_COLLECTION,
    schema: activityLogListSchema,
    loadFn: loadLogs,
    saveFn: replaceLogs,
    responseKey: 'logs',
    errorMessagePrefix: 'activity logs',
  });
}
