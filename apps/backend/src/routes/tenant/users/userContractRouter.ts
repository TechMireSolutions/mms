import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import type { User, UsersListQuery, WorkspaceUser } from '@mms/shared';
import { userContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs } from '../../../lib/contractRouterTypes.js';
import { canReadCollection, canWriteCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { usersUseCases } from '../../../users/use-cases/usersUseCases.js';
import { AUTH_RATE_LIMIT } from '../../../lib/rateLimitConfig.js';

import { parseRequest } from '../../../lib/zodRequest.js';
import { usersListQuerySchema } from '../../../validation/userSchemas.js';
import {
  dependencyForDiagnosticStage,
  getRequestDiagnosticContext,
  getRuntimeDependencySnapshot,
  markRequestDiagnosticStage,
  startRequestDiagnostics,
} from '../../../lib/requestDiagnostics.js';

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
  const diagnostic = getRequestDiagnosticContext(request);
  const failureStage = error.passwordResetStage ?? diagnostic?.stage;
  const dependency = dependencyForDiagnosticStage(failureStage);
  if (error.passwordResetStage) {
    markRequestDiagnosticStage(request, error.passwordResetStage);
  }
  request.log.error(
    {
      err,
      requestId: request.id,
      method: request.method,
      url: request.url,
      failureStage,
      dependency,
      ...(diagnostic ? { runtimeDependencies: getRuntimeDependencySnapshot() } : {}),
      ...context,
    },
    fallbackMessage,
  );

  const stageMessage = failureStage
    ? ` during ${failureStage.replaceAll('_', ' ')}`
    : '';
  return {
    status: 500 as const,
    body: {
      type: error.type === 'password_reset_failed' ? error.type : 'database_error',
      message: `${fallbackMessage}${stageMessage}. Reference: ${request.id}`,
      requestId: request.id,
      ...(failureStage ? { stage: failureStage } : {}),
      ...(dependency ? { dependency } : {}),
    },
  };
}

export const userContractRouter: FastifyPluginAsync = async (fastify) => {
  const resetPasswordRateLimit = fastify.rateLimit(AUTH_RATE_LIMIT);
  const router = s.router(userContract, {
    list: async ({ query, request }: ContractRouteArgs<typeof userContract['list']>): Promise<unknown> => {
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
    create: async ({ body, request }: ContractRouteArgs<typeof userContract['create']>): Promise<unknown> => {
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
    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof userContract['update']>): Promise<unknown> => {
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
    invite: async ({ body, request }: ContractRouteArgs<typeof userContract['invite']>): Promise<unknown> => {
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
    bulkUpdate: async ({ body, request }: ContractRouteArgs<typeof userContract['bulkUpdate']>): Promise<unknown> => {
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
    bulkDelete: async ({ body, request }: ContractRouteArgs<typeof userContract['bulkDelete']>): Promise<unknown> => {
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
    bulkRestore: async ({ body, request }: ContractRouteArgs<typeof userContract['bulkRestore']>): Promise<unknown> => {
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
    delete: async ({ params: { id }, request }: ContractRouteArgs<typeof userContract['delete']>): Promise<unknown> => {
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
    restore: async ({ params: { id }, request }: ContractRouteArgs<typeof userContract['restore']>): Promise<unknown> => {
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
    verifyEmail: async ({ params: { id }, request }: ContractRouteArgs<typeof userContract['verifyEmail']>): Promise<unknown> => {
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
      hooks: {
        onRequest: async (request: FastifyRequest) => {
          startRequestDiagnostics(request, 'users.reset_password');
        },
        preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
          markRequestDiagnosticStage(request, 'rate_limit');
          await resetPasswordRateLimit.call(fastify, request, reply);
        },
      },
      handler: async ({ params: { id }, body, request }: ContractRouteArgs<typeof userContract['resetPassword']>): Promise<unknown> => {
        let actorUserId = 'unknown';
        try {
          markRequestDiagnosticStage(request, 'authorization');
          const user = request.user as User;
          actorUserId = user?.id == null ? 'unknown' : String(user.id);
          if (!canWriteCollection(user, 'users')) {
            return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
          }
          if (actorUserId === id) {
            return {
              status: 400 as const,
              body: {
                type: 'self_password_reset',
                message: 'Use profile security settings to change your own password',
              },
            };
          }
          markRequestDiagnosticStage(request, 'password_reset');
          const ok = await usersUseCases.resetUserPasswordById(
            id,
            body.temporaryPassword,
            user.role,
            actorUserId,
            request.ip,
            (stage, error) => {
              request.log.warn(
                {
                  err: error,
                  requestId: request.id,
                  operation: 'users.reset_password',
                  failureStage: stage,
                  targetUserId: id,
                  actorUserId,
                  runtimeDependencies: getRuntimeDependencySnapshot(),
                },
                'Password reset completed but an auxiliary step failed',
              );
            },
          );
          if (!ok) return { status: 404 as const, body: { type: 'not_found', message: 'User not found' } };
          markRequestDiagnosticStage(request, 'response_serialization');
          return { status: 200 as const, body: { success: true as const } };
        } catch (error: unknown) {
          return handleUserRouterError(error, request, 'Failed to reset user password', {
            operation: 'users.reset_password',
            targetUserId: id,
            actorUserId,
          });
        }
      },
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router));
};
