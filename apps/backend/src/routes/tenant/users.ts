import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';
import type { User } from '@mms/shared';
import { USERS_MODULE_CONTRACT } from '@mms/shared';
import { sendForbidden } from '../../lib/httpErrors.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

import {
  loadWorkspaceUsers,
  replaceWorkspaceUsers,
  loadLogs,
  replaceLogs,
} from '../../services/usersService.js';
import {
  workspaceUserListSchema,
  activityLogListSchema,
} from '../../validation/usersSchemas.js';

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
  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ users: await loadWorkspaceUsers() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load workspace users' });
    }
  });

  fastify.put('/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, USERS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(workspaceUserListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const users = await replaceWorkspaceUsers(parsed.data);
      return reply.send({ users });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update workspace users' });
    }
  });

  // --- Activity Logs ---
  fastify.get('/activity', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, LOGS_COLLECTION)) return sendForbidden(reply);
    try {
      return reply.send({ logs: await loadLogs() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load activity logs' });
    }
  });

  fastify.put('/activity/bulk', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, LOGS_COLLECTION)) return sendForbidden(reply);
    const parsed = parseRequest(activityLogListSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const logs = await replaceLogs(parsed.data);
      return reply.send({ logs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to update activity logs' });
    }
  });

  registerColumnPreferencesRoutes(fastify, {
    path: '/column-preferences',
    collection: USERS_COLLECTION,
    objectKey: USERS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
  registerColumnPreferencesRoutes(fastify, {
    path: '/column-prefs',
    collection: USERS_COLLECTION,
    objectKey: USERS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });
}
