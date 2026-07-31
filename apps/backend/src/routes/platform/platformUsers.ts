import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  authenticatePlatform,
  requireSuperUser,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import { listPlatformUsers } from '../../db/repositories/platformUserRepository.js';
import {
  createVerifiedPlatformUser,
  setPlatformAdminPermissions,
  toPlatformUserProfile,
} from '../../services/platform/platformUserService.js';
import { hashPassword } from '../../services/auth/passwordService.js';
import {
  platformCreateAdminBodySchema,
  platformUpdateAdminPermissionsBodySchema,
} from '../../validation/platformSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';
import { PlatformError } from '../../services/platform/platformErrorService.js';

export default async function platformUsersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticatePlatform);
  fastify.addHook('preHandler', requireSuperUser);

  fastify.get('/', async (request, reply) => {
    const storedUsers = await listPlatformUsers();
    const users = storedUsers.map(toPlatformUserProfile);
    return reply.send({ users });
  });

  fastify.post('/', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const parsed = parseRequest(platformCreateAdminBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { name, email, password, permissions } = parsed.data;

    try {
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
        details: {
          adminEmail: email,
          adminName: name.trim(),
          permissions,
        },
        ipAddress: request.ip,
      });

      return reply.send({ user: toPlatformUserProfile(stored) });
    } catch (error: unknown) {
      if (error instanceof PlatformError) {
        return reply.status(error.statusCode).send({ type: error.code, message: error.message });
      }
      throw error;
    }
  });

  fastify.patch('/:id/permissions', async (request, reply) => {
    const { platformUser } = request as PlatformAuthenticatedRequest;
    const { id } = request.params as { id: string };
    const parsed = parseRequest(platformUpdateAdminPermissionsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    try {
      const user = await setPlatformAdminPermissions(id, parsed.data.permissions);

      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'update_admin_permissions',
        details: {
          adminId: id,
          adminEmail: user.email,
          permissions: parsed.data.permissions,
        },
        ipAddress: request.ip,
      });

      return reply.send({ user });
    } catch (error: unknown) {
      if (error instanceof PlatformError) {
        return reply.status(error.statusCode).send({ type: error.code, message: error.message });
      }
      throw error;
    }
  });
}
