import type { FastifyPluginAsync } from 'fastify';
import type { User, UsersListQuery, WorkspaceUser } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadCollection, canWriteCollection, canDeleteCollection } from '../../../services/rbacService.js';
import {
  loadUsersPage,
  upsertWorkspaceUsers,
  deleteUserById,
  restoreUserById,
  verifyUserEmailById,
  bulkSoftDeleteUsers,
  bulkRestoreUsers,
  resetUserPasswordById,
} from '../../../services/usersService.js';
import { AUTH_RATE_LIMIT } from '../../../lib/rateLimitConfig.js';

import { parseRequest } from '../../../lib/zodRequest.js';
import { usersListQuerySchema } from '../../../validation/userSchemas.js';

const s = initServer();

export const userContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.users, {
    list: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const parsedQuery = parseRequest(usersListQuerySchema, query);
      if (!parsedQuery.ok) {
        return { status: 400 as const, body: { type: 'validation_error', message: parsedQuery.message } };
      }
      try {
        // (typed as UsersListQuery because the wire query schema's includeDeleted allows 'true'/'false'
        //  strings while the service query type expects boolean)
        const result = await loadUsersPage(parsedQuery.data as UsersListQuery);
        return { status: 200 as const, body: result };
      } catch (err) {
        request.log.error(err, 'Failed to list users');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list users' } };
      }
    },
    bulkUpdate: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const updated = await upsertWorkspaceUsers(body as WorkspaceUser[]);
        return { status: 200 as const, body: { users: updated } };
      } catch (err) {
        request.log.error(err, 'Failed to update workspace users');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update workspace users' } };
      }
    },
    bulkDelete: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await bulkSoftDeleteUsers(body.ids.map(String), String(user.id));
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (err) {
        request.log.error(err, 'Failed to bulk delete users');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete users' } };
      }
    },
    bulkRestore: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await bulkRestoreUsers(body.ids.map(String));
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (err) {
        request.log.error(err, 'Failed to bulk restore users');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore users' } };
      }
    },
    delete: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const ok = await deleteUserById(id, String(user.id));
        if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (error: unknown) {
        if (error instanceof Error && (error as Error & { statusCode?: number }).statusCode === 400) {
          return {
            status: 400 as const,
            body: {
              type: (error as Error & { type?: string }).type ?? 'validation_error',
              message: error.message,
            },
          };
        }
        request.log.error(error, 'Failed to delete user');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete user' } };
      }
    },
    restore: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const ok = await restoreUserById(id);
        if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (err) {
        request.log.error(err, 'Failed to restore user');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to restore user' } };
      }
    },
    verifyEmail: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const ok = await verifyUserEmailById(id);
        if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (err) {
        request.log.error(err, 'Failed to verify user email');
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to verify user email' } };
      }
    },
    resetPassword: {
      hooks: { preHandler: fastify.rateLimit(AUTH_RATE_LIMIT) },
      handler: async ({ params: { id }, body, request }: any) => {
        const user = request.user as User;
        if (!canWriteCollection(user, 'users')) {
          return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
        }
        if (String(user.id) === id) {
          return {
            status: 400 as const,
            body: {
              type: 'self_password_reset',
              message: 'Use profile security settings to change your own password',
            },
          };
        }
        try {
          const ok = await resetUserPasswordById(id, body.temporaryPassword);
          if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
          return { status: 200 as const, body: { success: true as const } };
        } catch (error: unknown) {
          const err = error as Error & { statusCode?: number; type?: string };
          if (err.statusCode === 400) {
            return {
              status: 400 as const,
              body: { type: err.type ?? 'validation_error', message: err.message },
            };
          }
          request.log.error(error, 'Failed to reset user password');
          return { status: 500 as const, body: { type: 'database_error', message: 'Failed to reset user password' } };
        }
      },
    },
  } as any);

  await fastify.register(s.plugin(router));
};
