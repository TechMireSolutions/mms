import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import {
  platformSettingsUpdateSchema,
  resetDatabaseSchema,
} from '../../validation/platformSchemas.js';
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
import { verifyPlatformUserPassword } from '../../services/platform/platformUserService.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { insertPlatformActivityLog } from '../../db/repositories/platformActivityLogsRepository.js';
import { sendDatabaseError, sendInvalidCurrentPassword } from '../../lib/httpErrors.js';
import { AUTH_RATE_LIMIT } from '../../lib/rateLimitConfig.js';

export default async function platformSettingsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', requireMainDomain);

  fastify.get(
    '/',
    { preHandler: [authenticatePlatform, requireSuperUser] },
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
        targetResource: 'settings',
        ipAddress: request.ip,
      });

      return reply.send({ settings, success: true });
    },
  );

  await fastify.register(async function platformResetDatabaseRateLimited(inner) {
    await inner.register(rateLimit, AUTH_RATE_LIMIT);

    inner.post(
      '/reset-database',
      { preHandler: [authenticatePlatform, requireSuperUser] },
      async (request, reply) => {
        const parsed = parseRequest(resetDatabaseSchema, request.body ?? {});
        if (!parsed.ok) return replyValidationError(reply, parsed.message);

        const { platformUser } = request as PlatformAuthenticatedRequest;
        const passwordOk = await verifyPlatformUserPassword(platformUser.id, parsed.data.password);
        if (!passwordOk) {
          return sendInvalidCurrentPassword(reply);
        }

        try {
          // Audit outside the wiped schema — platform_activity_logs is destroyed by the reset.
          console.error(
            JSON.stringify({
              level: 'audit',
              action: 'reset_database',
              userId: platformUser.id,
              userEmail: platformUser.email,
              ipAddress: request.ip,
              at: new Date().toISOString(),
            }),
          );

          await resetAndReseedDatabase();
          clearPlatformAccessCookie(reply);
          return reply.send({
            success: true,
            message: 'Database wiped, migrated, and re-seeded successfully.',
          });
        } catch (error) {
          return sendDatabaseError(reply, 'Failed to reset database', error);
        }
      },
    );
  });
}
