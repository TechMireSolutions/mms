import type { FastifyPluginAsync } from 'fastify';
import { MESSAGING_MODULE_MANIFEST } from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';

import { messagingExportRoutes } from './messaging/messagingExportRoutes.js';
import { messagingLogRoutes } from './messaging/messagingLogRoutes.js';
import { messagingRecipientRoutes } from './messaging/messagingRecipientRoutes.js';
import { messagingTemplateRoutes } from './messaging/messagingTemplateRoutes.js';
import { messagingContractRouter } from './messaging/messagingContractRouter.js';



const messagingRoutes: FastifyPluginAsync = async (
  fastify,
  _options,
) => {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('messaging'));

  await fastify.register(
    async (sub) => {

      await sub.register(messagingRecipientRoutes);
      await sub.register(messagingTemplateRoutes);
      await sub.register(messagingLogRoutes);
      await sub.register(messagingExportRoutes);
    },
    { prefix: '/api/messaging' },
  );

  await fastify.register(messagingContractRouter);
};

export default messagingRoutes;
