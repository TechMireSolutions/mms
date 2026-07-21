import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { platformSettingsUpdateSchema, resetDatabaseSchema } from '@mms/shared';
import {
  authenticatePlatform,
  type PlatformAuthenticatedRequest,
} from '../../middleware/authenticatePlatform.js';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../../services/platform/platformSettingsService.js';
import { resetAndReseedDatabase } from '../../services/platform/platformDatabaseService.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { sendForbidden } from '../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';

export default async function platformSettingsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', async (request, reply) => {
    if (getRequestTenant()) {
      return sendForbidden(reply, 'Platform actions are only available on the main domain');
    }
  });

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
    { preHandler: authenticatePlatform },
    async (request, reply) => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      if (platformUser.role !== 'super_user') {
        return sendForbidden(reply, 'Only platform super-users can update platform settings');
      }

      const parsed = parseRequest(platformSettingsUpdateSchema, request.body ?? {});
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      const settings = await updatePlatformSettings(parsed.data);
      return reply.send({ settings, success: true });
    },
  );

  fastify.post(
    '/reset-database',
    { preHandler: authenticatePlatform },
    async (request, reply) => {
      const { platformUser } = request as PlatformAuthenticatedRequest;
      if (platformUser.role !== 'super_user') {
        return sendForbidden(reply, 'Only platform super-users can reset the database');
      }

      const parsed = parseRequest(resetDatabaseSchema, request.body ?? {});
      if (!parsed.ok) return replyValidationError(reply, parsed.message);

      await resetAndReseedDatabase();
      return reply.send({
        success: true,
        message: 'Database wiped, migrated, and re-seeded successfully.',
      });
    },
  );
}
