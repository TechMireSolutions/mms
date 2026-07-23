import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  authenticatePlatform,
  requireSuperUser,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import { listPlatformUsers } from '../../db/repositories/platformUserRepository.js';
import {
  createVerifiedPlatformUser,
  toPlatformUserProfile,
} from '../../services/platform/platformUserService.js';
import { hashPassword } from '../../services/auth/passwordService.js';
import { platformCreateAdminBodySchema } from '../../validation/platformSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';

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
    const { name, email, password } = parsed.data;

    const passwordHash = await hashPassword(password);
    const stored = await createVerifiedPlatformUser({
      name: name.trim(),
      email,
      passwordHash,
      role: 'admin',
    });

    await insertPlatformActivityLog({
      userId: platformUser.id,
      userEmail: platformUser.email,
      action: 'create_admin',
      details: { adminEmail: email, adminName: name.trim() },
      ipAddress: request.ip,
    });

    return reply.send({ user: toPlatformUserProfile(stored) });
  });
}

