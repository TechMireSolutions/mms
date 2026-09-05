import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticatePlatform } from '../../middleware/authenticatePlatform.js';
import { getIntrospectedErdDomains } from '../../services/platform/platformErdService.js';

/**
 * Platform schema routes providing dynamic database introspection and live ERD catalogs.
 * Restricted to authenticated platform operators.
 */
export default async function platformSchemaRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get(
    '/erd',
    {
      preHandler: [authenticatePlatform],
    },
    async (_request, reply) => {
      const erdData = getIntrospectedErdDomains();
      return reply.status(200).send(erdData);
    },
  );
}
