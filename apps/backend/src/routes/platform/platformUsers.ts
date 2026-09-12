import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { initServer } from '@ts-rest/fastify';
import { platformAdminsContract } from '@mms/shared';
import type { ContractRouteArgs, ContractRouteResponse } from '../../lib/contractRouterTypes.js';
import {
  authenticatePlatform,
  requirePlatformPermission,
  requirePlatformSuperUser,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import { listPlatformUsers } from '../../db/repositories/platformUserRepository.js';
import {
  createVerifiedPlatformUser,
  deletePlatformAdmin,
  setPlatformAdminDisabled,
  setPlatformAdminPermissions,
  toPlatformUserProfile,
  verifyPlatformUserPassword,
  verifyPlatformUserEmail,
} from '../../services/platform/platformUserService.js';
import { hashPassword } from '../../services/auth/passwordService.js';
import { replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';

const s = initServer();

export default async function platformUsersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const authRateLimit = fastify.rateLimit(AUTH_RATE_LIMIT);

  fastify.addHook('preHandler', authenticatePlatform);
  fastify.addHook('preHandler', requirePlatformPermission('admins'));

  const router = s.router(platformAdminsContract, {
    listAdmins: async (): Promise<ContractRouteResponse<typeof platformAdminsContract['listAdmins']>> => {
      const storedUsers = await listPlatformUsers();
      const users = storedUsers.map(toPlatformUserProfile);
      return { status: 200 as const, body: { users } };
    },

    createAdmin: {
      hooks: {
        preHandler: requirePlatformSuperUser(),
      },
      handler: async ({
        body,
        request,
      }: ContractRouteArgs<typeof platformAdminsContract['createAdmin']>): Promise<ContractRouteResponse<typeof platformAdminsContract['createAdmin']>> => {
        const { platformUser } = request as PlatformAuthenticatedRequest;
        const { name, email, password, permissions } = body;

        const passwordHash = await hashPassword(password);
        const stored = await createVerifiedPlatformUser({
          name: name.trim(),
          email,
          passwordHash,
          role: 'admin',
          permissions,
        });

        await insertPlatformActivityLog({
          userId: platformUser.id,
          userEmail: platformUser.email,
          action: 'create_admin',
          targetResource: 'admin',
          targetId: stored.id,
          metadataMessage: `Created admin ${email}`,
          ipAddress: request.ip,
        });

        return { status: 200 as const, body: { user: toPlatformUserProfile(stored) } };
      },
    },

    updateAdminPermissions: {
      hooks: {
        preHandler: requirePlatformSuperUser(),
      },
      handler: async ({
        params,
        body,
        request,
      }: ContractRouteArgs<typeof platformAdminsContract['updateAdminPermissions']>): Promise<ContractRouteResponse<typeof platformAdminsContract['updateAdminPermissions']>> => {
        const { platformUser } = request as PlatformAuthenticatedRequest;

        // Prevent an admin from escalating their own permissions.
        if (params.adminId === platformUser.id) {
          return {
            status: 403 as const,
            body: { type: 'forbidden', message: 'Cannot change your own permissions' },
          };
        }

        const user = await setPlatformAdminPermissions(params.adminId, body.permissions);

        await insertPlatformActivityLog({
          userId: platformUser.id,
          userEmail: platformUser.email,
          action: 'update_admin_permissions',
          targetResource: 'admin',
          targetId: params.adminId,
          metadataMessage: `Updated permissions for ${user.email}`,
          ipAddress: request.ip,
        });

        return { status: 200 as const, body: { user } };
      },
    },

    verifyAdminEmail: async ({
      params,
      request,
    }: ContractRouteArgs<typeof platformAdminsContract['verifyAdminEmail']>): Promise<ContractRouteResponse<typeof platformAdminsContract['verifyAdminEmail']>> => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const user = await verifyPlatformUserEmail(params.adminId);

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'verify_admin_email',
        targetResource: 'admin',
        targetId: params.adminId,
        metadataMessage: `Verified email for ${user.email}`,
        ipAddress: request.ip,
      });

      return { status: 200 as const, body: { user, success: true as const } };
    },

    setAdminDisabled: {
      hooks: {
        preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
          await authRateLimit.call(fastify, request, reply);
        },
      },
      handler: async ({
        params,
        body,
        request,
      }: ContractRouteArgs<typeof platformAdminsContract['setAdminDisabled']>): Promise<ContractRouteResponse<typeof platformAdminsContract['setAdminDisabled']>> => {
        const { platformUser } = request as PlatformAuthenticatedRequest;

        if (params.adminId === platformUser.id) {
          return {
            status: 403 as const,
            body: { type: 'forbidden', message: 'Cannot disable your own platform account' },
          };
        }

        const passwordOk = await verifyPlatformUserPassword(platformUser.id, body.password);
        if (!passwordOk) {
          return {
            status: 401 as const,
            body: { type: 'invalid_current_password', message: 'Current password is incorrect' },
          };
        }

        const user = await setPlatformAdminDisabled(params.adminId, body.disabled);

        await insertPlatformActivityLog({
          userId: platformUser.id,
          userEmail: platformUser.email,
          action: body.disabled ? 'disable_admin' : 'enable_admin',
          targetResource: 'admin',
          targetId: params.adminId,
          metadataMessage: `${body.disabled ? 'Disabled' : 'Enabled'} admin ${user.email}`,
          ipAddress: request.ip,
        });

        return { status: 200 as const, body: { user } };
      },
    },

    deleteAdmin: {
      hooks: {
        preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
          await authRateLimit.call(fastify, request, reply);
        },
      },
      handler: async ({
        params,
        body,
        request,
      }: ContractRouteArgs<typeof platformAdminsContract['deleteAdmin']>): Promise<ContractRouteResponse<typeof platformAdminsContract['deleteAdmin']>> => {
        const { platformUser } = request as PlatformAuthenticatedRequest;

        if (params.adminId === platformUser.id) {
          return {
            status: 403 as const,
            body: { type: 'forbidden', message: 'Cannot delete your own platform account' },
          };
        }

        const passwordOk = await verifyPlatformUserPassword(platformUser.id, body.password);
        if (!passwordOk) {
          return {
            status: 401 as const,
            body: { type: 'invalid_current_password', message: 'Current password is incorrect' },
          };
        }

        await deletePlatformAdmin(params.adminId);

        await insertPlatformActivityLog({
          userId: platformUser.id,
          userEmail: platformUser.email,
          action: 'delete_admin',
          targetResource: 'admin',
          targetId: params.adminId,
          ipAddress: request.ip,
        });

        return { status: 200 as const, body: { deleted: true as const, id: params.adminId } };
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
