import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { MESSAGING_MODULE_MANIFEST } from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerDefaultBackgroundJobRunners } from '../../services/backgroundJobRunnerService.js';
import { messagingExportRoutes } from './messaging/messagingExportRoutes.js';
import { messagingLogRoutes } from './messaging/messagingLogRoutes.js';
import { messagingRecipientRoutes } from './messaging/messagingRecipientRoutes.js';
import { messagingTemplateRoutes } from './messaging/messagingTemplateRoutes.js';

let backgroundJobRunnersReady = false;

function ensureBackgroundJobRunners(): void {
  if (backgroundJobRunnersReady) return;
  registerDefaultBackgroundJobRunners();
  backgroundJobRunnersReady = true;
}

export default async function messagingRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  ensureBackgroundJobRunners();
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('messaging'));

  registerColumnPreferencesRoutes(fastify, {
    path: '/recipients/column-preferences',
    collection: 'message_logs',
    objectKey: MESSAGING_MODULE_MANIFEST.recipientsColumnPreferencesObjectKey,
  });
  registerColumnPreferencesRoutes(fastify, {
    path: '/history/column-preferences',
    collection: 'message_logs',
    objectKey: MESSAGING_MODULE_MANIFEST.historyColumnPreferencesObjectKey,
  });
  registerColumnPreferencesRoutes(fastify, {
    path: '/templates/column-preferences',
    collection: 'message_logs',
    objectKey: MESSAGING_MODULE_MANIFEST.templatesColumnPreferencesObjectKey,
  });

  await fastify.register(messagingRecipientRoutes);
  await fastify.register(messagingTemplateRoutes);
  await fastify.register(messagingLogRoutes);
  await fastify.register(messagingExportRoutes);
}
