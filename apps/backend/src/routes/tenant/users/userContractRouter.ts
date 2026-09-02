import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { User, UsersListQuery, WorkspaceUser } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadCollection, canWriteCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { usersUseCases } from '../../../users/use-cases/usersUseCases.js';
import { AUTH_RATE_LIMIT } from '../../../lib/rateLimitConfig.js';

import { parseRequest } from '../../../lib/zodRequest.js';
import { usersListQuerySchema } from '../../../validation/userSchemas.js';

const s = initServer();

function handleUserRouterError(
  err: unknown,
  request: FastifyRequest,
  fallbackMessage: string,
  context: Record<string, string> = {},
) {
  const error = err as Error & {
    statusCode?: number;
    type?: string;
    passwordResetStage?: string;
  };
  if (error.statusCode === 404) {
    return { status: 404 as const, body: { type: 'not_found', message: error.message || 'User not found' } };
  }
  if (error.statusCode === 403) {
    return { status: 403 as const, body: { type: error.type ?? 'forbidden', message: error.message } };
  }
  if (error.statusCode === 400) {
    return { status: 400 as const, body: { type: error.type ?? 'validation_error', message: error.message } };
  }
  request.log.error(
    {
      err,
      requestId: request.id,
      method: request.method,
      url: request.url,
      failureStage: error.passwordResetStage,
      ...context,
    },
    fallbackMessage,
  );

  const stageMessage = error.passwordResetStage
    ? ` during ${error.passwordResetStage.replaceAll('_', ' ')}`
    : '';
  return {
    status: 500 as const,
    body: {
      type: error.type === 'password_reset_failed' ? error.type : 'database_error',
      message: `${fallbackMessage}${stageMessage}. Reference: ${request.id}`,
      requestId: request.id,
      ...(error.passwordResetStage ? { stage: error.passwordResetStage } : {}),
    },
  };
}

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
        const result = await usersUseCases.loadUsersPage(parsedQuery.data as UsersListQuery);
        return { status: 200 as const, body: result };
      } catch (err) {
        return handleUserRouterError(err, request, 'Failed to list users');
      }
    },
    create: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const created = await usersUseCases.createWorkspaceUser(body, String(user.id), user.role, request.ip);
        return { status: 200 as const, body: { user: created } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to create workspace user');
      }
    },
    update: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const updated = await usersUseCases.updateWorkspaceUser(id, body, String(user.id), user.role, request.ip);
        return { status: 200 as const, body: { user: updated } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to update workspace user');
      }
    },
    invite: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const invited = await usersUseCases.inviteWorkspaceUser(body, String(user.id), user.role, request.ip);
        return { status: 200 as const, body: { user: invited } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to invite workspace user');
      }
    },
    bulkUpdate: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const updated = await usersUseCases.upsertWorkspaceUsers(body as WorkspaceUser[], user.role);
        return { status: 200 as const, body: { users: updated } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to update workspace users');
      }
    },
    bulkDelete: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await usersUseCases.bulkSoftDeleteUsers(body.ids.map(String), String(user.id), user.role);
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to bulk delete users');
      }
    },
    bulkRestore: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await usersUseCases.bulkRestoreUsers(body.ids.map(String), user.role);
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to bulk restore users');
      }
    },
    delete: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const ok = await usersUseCases.deleteUserById(id, String(user.id), user.role);
        if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (error: unknown) {
        return handleUserRouterError(error, request, 'Failed to delete user');
      }
    },
    restore: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const ok = await usersUseCases.restoreUserById(id, user.role);
        if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to restore user');
      }
    },
    verifyEmail: async ({ params: { id }, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, 'users')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const ok = await usersUseCases.verifyUserEmailById(id, user.role);
        if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (err: unknown) {
        return handleUserRouterError(err, request, 'Failed to verify user email');
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
          const ok = await usersUseCases.resetUserPasswordById(
            id,
            body.temporaryPassword,
            user.role,
            String(user.id),
            request.ip,
            (stage, error) => {
              request.log.warn(
                {
                  err: error,
                  requestId: request.id,
                  operation: 'users.reset_password',
                  failureStage: stage,
                  targetUserId: id,
                  actorUserId: String(user.id),
                },
                'Password reset completed but an auxiliary step failed',
              );
            },
          );
          if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
          return { status: 200 as const, body: { success: true as const } };
        } catch (error: unknown) {
          return handleUserRouterError(error, request, 'Failed to reset user password', {
            operation: 'users.reset_password',
            targetUserId: id,
            actorUserId: String(user.id),
          });
        }
      },
    },
  } as any);

  await fastify.register(s.plugin(router));
};
