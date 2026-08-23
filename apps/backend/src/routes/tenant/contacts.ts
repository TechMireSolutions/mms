import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { CONTACTS_MODULE_MANIFEST, type User } from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { registerDefaultBackgroundJobRunners } from '../../services/backgroundJobRunnerService.js';
import { contactUseCases } from '../../contacts/use-cases/contactUseCases.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { contactGoogleSyncRoutes } from './contacts/googleSyncRoutes.js';
import { contactOperationRoutes } from './contacts/contactOperationRoutes.js';
import { contactContractRouter } from './contacts/contactContractRouter.js';
import { contactSavedReportRoutes } from './contacts/savedReportRoutes.js';
import { contactLookupRoutes } from './contacts/contactLookupRoutes.js';
import { contactSetupConfigRoutes } from './contacts/contactSetupConfigRoutes.js';
import { sanitizeForUser } from './contacts/contactRouteHelpers.js';

let backgroundJobRunnersReady = false;

function ensureBackgroundJobRunners(): void {
  if (backgroundJobRunnersReady) return;
  registerDefaultBackgroundJobRunners();
  backgroundJobRunnersReady = true;
}

/**
 * Server-first contact resource routes (TanStack Query on FE).
 */
export async function contactRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  ensureBackgroundJobRunners();
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('contacts'));

  await fastify.register(
    async (sub) => {
      registerCountRoute(sub, {
        collection: 'contacts',
        loadCountFn: () => contactUseCases.countContacts(),
        errorMessagePrefix: 'contacts',
      });

      registerMetricsRoute(sub, {
        collection: 'contacts',
        loadMetricsFn: () => contactUseCases.loadContactsCommandMetrics(),
        errorMessagePrefix: 'contact',
      });

      registerWidgetAggregatesRoute(sub, {
        collection: 'contacts',
        loadAggregatesFn: (queries) => contactUseCases.loadContactsWidgetAggregates(queries),
        errorMessagePrefix: 'contact',
      });

      registerResolveRoute(sub, {
        collection: 'contacts',
        loadByIdsFn: async (ids, request) => {
          const user = request.user as User;
          const contacts = await contactUseCases.loadContactsByIds(ids);
          return sanitizeForUser(contacts, user);
        },
        responseKey: 'contacts',
        errorMessagePrefix: 'contacts',
      });

      await sub.register(contactOperationRoutes);
      await sub.register(contactLookupRoutes);
      await sub.register(contactSetupConfigRoutes);

      registerColumnPreferencesRoutes(sub, {
        collection: 'contacts',
        objectKey: CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey,
      });

      await sub.register(contactSavedReportRoutes);
      await sub.register(contactGoogleSyncRoutes);
    },
    { prefix: '/api/contacts' },
  );

  await fastify.register(contactContractRouter);
}
