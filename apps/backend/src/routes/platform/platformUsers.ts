import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  authenticatePlatform,
  requireSuperUser,
} from '../../middleware/authenticatePlatform.js';
import { listPlatformUsers } from '../../db/repositories/platformUserRepository.js';
import { toPlatformUserProfile } from '../../services/platform/platformProfileService.js';
import { createVerifiedPlatformUser } from '../../services/platform/platformUserService.js';
import { hashPassword } from '../../services/auth/passwordService.js';
import { platformCreateAdminBodySchema } from '../../validation/platformSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

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
    const parsed = parseRequest(platformCreateAdminBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { name, email, password } = parsed.data;

    try {
      const passwordHash = await hashPassword(password);
      const stored = await createVerifiedPlatformUser({
        name: name.trim(),
        email,
        passwordHash,
        role: 'admin',
      });

      return reply.send({ user: toPlatformUserProfile(stored) });
    } catch (error: unknown) {
      return reply.status(409).send({
        type: 'conflict',
        message: error instanceof Error ? error.message : 'Failed to create administrator',
      });
    }
  });
}
