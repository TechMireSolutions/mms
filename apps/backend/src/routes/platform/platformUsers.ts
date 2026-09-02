import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  authenticatePlatform,
  requirePlatformPermission,
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
import {
  platformAdminDisabledBodySchema,
  platformCreateAdminBodySchema,
  platformDeleteAdminBodySchema,
  platformUpdateAdminPermissionsBodySchema,
} from '../../validation/platformSchemas.js';
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';
import { sendForbidden, sendInvalidCurrentPassword } from '../../lib/httpErrors.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';

export default async function platformUsersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);
  fastify.addHook('preHandler', requirePlatformPermission('admins'));

  fastify.get('/', async (_request, reply) => {
    const storedUsers = await listPlatformUsers();
    const users = storedUsers.map(toPlatformUserProfile);
    return reply.send({ users });
  });

  fastify.post('/', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const parsed = parseRequest(platformCreateAdminBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { name, email, password, permissions } = parsed.data;

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

    return reply.send({ user: toPlatformUserProfile(stored) });
  });

  fastify.patch('/:id/permissions', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const parsed = parseRequest(platformUpdateAdminPermissionsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const user = await setPlatformAdminPermissions(params.data.id, parsed.data.permissions);

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'update_admin_permissions',
      targetResource: 'admin',
      targetId: params.data.id,
      metadataMessage: `Updated permissions for ${user.email}`,
      ipAddress: request.ip,
    });

    return reply.send({ user });
  });

  fastify.post('/:id/verify-email', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const user = await verifyPlatformUserEmail(params.data.id);

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'verify_admin_email',
      targetResource: 'admin',
      targetId: params.data.id,
      metadataMessage: `Verified email for ${user.email}`,
      ipAddress: request.ip,
    });

    return reply.send({ user, success: true });
  });

  await fastify.register(async function platformAdminDestructiveRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.patch('/:id/disabled', async (request, reply) => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      const parsed = parseRequest(platformAdminDisabledBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      if (params.data.id === platformUser.id) {
        return sendForbidden(reply, 'Cannot disable your own platform account');
      }

      const passwordOk = await verifyPlatformUserPassword(platformUser.id, parsed.data.password);
      if (!passwordOk) {
        return sendInvalidCurrentPassword(reply);
      }

      const user = await setPlatformAdminDisabled(params.data.id, parsed.data.disabled);

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: parsed.data.disabled ? 'disable_admin' : 'enable_admin',
        targetResource: 'admin',
        targetId: params.data.id,
        metadataMessage: `${parsed.data.disabled ? 'Disabled' : 'Enabled'} admin ${user.email}`,
        ipAddress: request.ip,
      });

      return reply.send({ user });
    });

    inner.delete('/:id', async (request, reply) => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      const params = parseRequest(resourceIdParamsSchema, request.params);
      if (!params.ok) return replyValidationError(reply, params.message);
      const parsed = parseRequest(platformDeleteAdminBodySchema, request.body);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      if (params.data.id === platformUser.id) {
        return sendForbidden(reply, 'Cannot delete your own platform account');
      }

      const passwordOk = await verifyPlatformUserPassword(platformUser.id, parsed.data.password);
      if (!passwordOk) {
        return sendInvalidCurrentPassword(reply);
      }

      await deletePlatformAdmin(params.data.id);

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'delete_admin',
        targetResource: 'admin',
        targetId: params.data.id,
        ipAddress: request.ip,
      });

      return reply.send({ deleted: true, id: params.data.id });
    });
  });
}
