import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { initServer } from '@ts-rest/fastify';
import { platformWorkspacesContract } from '@mms/shared';
import type { ContractRouteArgs } from '../../lib/contractRouterTypes.js';
import {
  authenticatePlatform,
  requirePlatformPermission,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  deleteWorkspace,
  getWorkspaceGrantedModules,
  listPlatformWorkspaces,
  setWorkspaceEmailVerification,
  setWorkspaceEnabled,
  updateWorkspaceModules,
} from '../../services/workspaceService.js';
import { verifyPlatformUserPassword } from '../../services/platform/platformUserService.js';
import { replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';
import { blockTenant, unblockTenant } from '../../services/session.service.js';

const s = initServer();

export default async function platformWorkspaceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const deleteRateLimit = fastify.rateLimit(AUTH_RATE_LIMIT);

  fastify.addHook('preHandler', authenticatePlatform);
  fastify.addHook('preHandler', requirePlatformPermission('workspaces'));

  const router = s.router(platformWorkspacesContract, {
    listWorkspaces: async (): Promise<unknown> => {
      const workspaces = await listPlatformWorkspaces();
      return { status: 200 as const, body: { workspaces } };
    },

    patchWorkspace: async ({
      params,
      body,
      request,
    }: ContractRouteArgs<typeof platformWorkspacesContract['patchWorkspace']>): Promise<unknown> => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const updated = await setWorkspaceEnabled(params.subdomain, body.enabled);
      if (!updated) {
        return { status: 404 as const, body: { type: 'not_found', message: 'Workspace not found' } };
      }

      if (body.enabled) {
        await unblockTenant(params.subdomain);
      } else {
        await blockTenant(params.subdomain);
      }

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'toggle_workspace',
        targetResource: 'workspace',
        targetId: params.subdomain,
        metadataMessage: `Set enabled=${body.enabled}`,
        ipAddress: request.ip,
      });

      const workspaces = await listPlatformWorkspaces();
      const row = workspaces.find((ws) => ws.subdomain === updated.subdomain);
      return { status: 200 as const, body: { workspace: row } };
    },

    getWorkspaceModules: async ({
      params,
    }: ContractRouteArgs<typeof platformWorkspacesContract['getWorkspaceModules']>): Promise<unknown> => {
      const modules = await getWorkspaceGrantedModules(params.subdomain);
      return { status: 200 as const, body: { modules } };
    },

    updateWorkspaceModules: async ({
      params,
      body,
      request,
    }: ContractRouteArgs<typeof platformWorkspacesContract['updateWorkspaceModules']>): Promise<unknown> => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const result = await updateWorkspaceModules(params.subdomain, body.modules);

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'update_workspace_modules',
        targetResource: 'workspace',
        targetId: params.subdomain,
        metadataMessage: `modules=[${body.modules.join(',')}]`,
        ipAddress: request.ip,
      });

      return { status: 200 as const, body: { success: true as const, modules: result.modules } };
    },

    patchWorkspaceEmailVerification: async ({
      params,
      body,
      request,
    }: ContractRouteArgs<typeof platformWorkspacesContract['patchWorkspaceEmailVerification']>): Promise<unknown> => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const result = await setWorkspaceEmailVerification(
        params.subdomain,
        body.requireEmailVerification,
      );
      if (!result) {
        return { status: 404 as const, body: { type: 'not_found', message: 'Workspace not found' } };
      }

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'update_workspace_email_verification',
        targetResource: 'workspace',
        targetId: params.subdomain,
        metadataMessage: `requireEmailVerification=${body.requireEmailVerification}`,
        ipAddress: request.ip,
      });

      return {
        status: 200 as const,
        body: {
          success: true as const,
          subdomain: result.subdomain,
          requireEmailVerification: result.requireEmailVerification,
        },
      };
    },

    verifyTenantUserEmail: async ({
      params,
      request,
    }: ContractRouteArgs<typeof platformWorkspacesContract['verifyTenantUserEmail']>): Promise<unknown> => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const { subdomain, userId } = params;

      const {
        verifyTenantUserEmailRow,
        findTenantUserRowById,
      } = await import('../../db/repositories/tenantUserRepository.js');

      // Validate the user actually belongs to the given workspace subdomain.
      const existing = await findTenantUserRowById(userId);
      if (!existing || existing.workspaceSubdomain !== subdomain) {
        return { status: 404 as const, body: { type: 'not_found', message: 'User not found in workspace' } };
      }

      const ok = await verifyTenantUserEmailRow(userId);
      if (!ok) {
        return { status: 404 as const, body: { type: 'not_found', message: 'User not found in workspace' } };
      }

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'verify_tenant_user_email',
        targetResource: 'workspace_user',
        targetId: `${subdomain}:${userId}`,
        metadataMessage: `Verified tenant user ${userId} in ${subdomain}`,
        ipAddress: request.ip,
      });

      return { status: 200 as const, body: { success: true as const } };
    },

    deleteWorkspace: {
      hooks: {
        preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
          await deleteRateLimit.call(fastify, request, reply);
          if (reply.sent) return;
          const req = request as PlatformAuthenticatedRequest;
          if (req.platformUser?.role !== 'super_user') {
            return reply.status(403).send({ type: 'forbidden', message: 'Super-user privilege required' });
          }
        },
      },
      handler: async ({
        params,
        body,
        request,
      }: ContractRouteArgs<typeof platformWorkspacesContract['deleteWorkspace']>): Promise<unknown> => {
        const { platformUser } = request as PlatformAuthenticatedRequest;
        if (platformUser.role !== 'super_user') {
          return { status: 403 as const, body: { type: 'forbidden', message: 'Super-user privilege required' } };
        }

        const passwordOk = await verifyPlatformUserPassword(platformUser.id, body.password);
        if (!passwordOk) {
          return {
            status: 401 as const,
            body: { type: 'invalid_current_password', message: 'Current password is incorrect' },
          };
        }

        if (body.confirmSubdomain.trim().toLowerCase() !== params.subdomain.toLowerCase()) {
          return {
            status: 400 as const,
            body: {
              type: 'validation_error',
              message: 'Confirmation subdomain does not match the workspace being deleted',
            },
          };
        }

        const removed = await deleteWorkspace(params.subdomain);
        if (!removed) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Workspace not found' } };
        }

        await blockTenant(params.subdomain);

        await insertPlatformActivityLog({
          userId: platformUser.id,
          userEmail: platformUser.email,
          action: 'delete_workspace',
          targetResource: 'workspace',
          targetId: params.subdomain,
          ipAddress: request.ip,
        });

        return { status: 200 as const, body: { deleted: true as const, subdomain: removed.subdomain } };
      },
    },
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router), {
    requestValidationErrorHandler: (err, _request, reply) => {
      const zErr = err.body ?? err.query ?? err.pathParams ?? err.headers;
      const message = zErr instanceof Error ? zErr.message : err.message;
      void replyValidationError(reply, message);
    },
  });
}
