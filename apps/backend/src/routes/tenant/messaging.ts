import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { messagingLogRoutes } from './messaging/messagingLogRoutes.js';
import { messagingRecipientRoutes } from './messaging/messagingRecipientRoutes.js';
import { messagingTemplateRoutes } from './messaging/messagingTemplateRoutes.js';

export default async function messagingRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  await fastify.register(messagingRecipientRoutes);
  await fastify.register(messagingTemplateRoutes);
  await fastify.register(messagingLogRoutes);
}
