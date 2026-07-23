import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { platformSettingsUpdateSchema, resetDatabaseSchema } from '@mms/shared';
import {
  authenticatePlatform,
  requireMainDomain,
  requireSuperUser,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../../services/platform/platformSettingsService.js';
import { clearPlatformAccessCookie } from '../../services/platform/platformCookieService.js';
import { resetAndReseedDatabase } from '../../services/platform/platformDatabaseService.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';

export default async function platformSettingsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', requireMainDomain);

  fastify.get(
    '/',
    { preHandler: authenticatePlatform },
    async (_request, reply) => {
      const settings = getPlatformSettings();
      return reply.send({ settings });
    },
  );

  fastify.put(
    '/',
    { preHandler: [authenticatePlatform, requireSuperUser] },
    async (request, reply) => {
      const parsed = parseRequest(platformSettingsUpdateSchema, request.body ?? {});
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const settings = await updatePlatformSettings(parsed.data);
      const { platformUser } = request as PlatformAuthenticatedRequest;
      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'update_settings',
        details: parsed.data,
        ipAddress: request.ip,
      });

      return reply.send({ settings, success: true });
    },
  );

  fastify.post(
    '/reset-database',
    { preHandler: [authenticatePlatform, requireSuperUser] },
    async (request, reply) => {
      const parsed = parseRequest(resetDatabaseSchema, request.body ?? {});
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const { platformUser } = request as PlatformAuthenticatedRequest;
      await insertPlatformActivityLog({
        userId: platformUser.id,
        userEmail: platformUser.email,
        action: 'reset_database',
        details: {},
        ipAddress: request.ip,
      });

      await resetAndReseedDatabase();
      clearPlatformAccessCookie(reply);
      return reply.send({
        success: true,
        message: 'Database wiped, migrated, and re-seeded successfully.',
      });
    },
  );
}

