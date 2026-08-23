import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import {
  USERS_MODULE_MANIFEST,
  activityLogListSchema,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerCountRoute,
  registerMetricsRoute,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import {
  loadLogs,
  upsertLogs,
  countUsers,
  loadUsersCommandMetrics,
} from '../../services/usersService.js';
import { userExportRoutes } from './users/userExportRoutes.js';
import { userSetupConfigRoutes } from './users/userSetupConfigRoutes.js';
import { userContractRouter } from './users/userContractRouter.js';

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
  fastify.addHook('preHandler', requireTenantModule('users'));

  await fastify.register(
    async (sub) => {
      await sub.register(userSetupConfigRoutes);
      await sub.register(userExportRoutes);

      registerMetricsRoute(sub, {
        collection: USERS_COLLECTION,
        errorMessagePrefix: 'workspace users',
        loadMetricsFn: loadUsersCommandMetrics,
      });

      registerCountRoute(sub, {
        path: '/count',
        collection: USERS_COLLECTION,
        loadCountFn: countUsers,
        errorMessagePrefix: 'workspace users',
      });

      registerColumnPreferencesRoutes(sub, {
        path: '/column-preferences',
        collection: USERS_COLLECTION,
        objectKey: USERS_MODULE_MANIFEST.columnPreferencesObjectKey,
      });

      registerBulkRoutes(sub, {
        path: '/activity',
        collection: LOGS_COLLECTION,
        schema: activityLogListSchema,
        loadFn: loadLogs,
        saveFn: upsertLogs,
        responseKey: 'logs',
        errorMessagePrefix: 'activity logs',
      });
    },
    { prefix: '/api/users' },
  );

  await fastify.register(userContractRouter);
}
