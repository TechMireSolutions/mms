import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { platformAiQueryRequestSchema } from '@mms/shared';
import { authenticatePlatform } from '../../middleware/authenticatePlatform.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { synthesizePlatformAiDiagnostics } from '../../services/platform/platformAiService.js';

export default async function platformAiRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.post(
    '/query',
    {
      preHandler: [authenticatePlatform],
    },
    async (request, reply) => {
      const parsed = parseRequest(platformAiQueryRequestSchema, request.body);
      if (!parsed.ok) {
        return replyValidationError(reply, parsed.message);
      }

      try {
        const result = await synthesizePlatformAiDiagnostics(parsed.data);
        return reply.send(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to generate diagnostics';
        return reply.status(500).send({
          success: false,
          analysis: `Diagnostic error: ${message}`,
          suggestions: [],
        });
      }
    },
  );
}
