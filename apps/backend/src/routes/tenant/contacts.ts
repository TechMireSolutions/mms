import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { Contact, ContactsListPageResult, User } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteContacts, canReadContacts } from '../../services/rbacService.js';
import {
  contactFieldUsageBatchBodySchema,
  contactFieldUsageParamsSchema,
  contactsListQuerySchema,
  contactsReportAnalyticsQuerySchema,
} from '../../validation/contactSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { registerDefaultBackgroundJobRunners } from '../../services/backgroundJobRunnerService.js';
import { contactUseCases } from '../../contacts/use-cases/contactUseCases.js';
import { sendDatabaseError } from '../../lib/httpErrors.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerPaginatedListRoute,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { registerFieldUsageRoutes } from '../../lib/registerFieldUsageRoutes.js';
import { contactGoogleSyncRoutes } from './contacts/googleSyncRoutes.js';
import { contactOperationRoutes } from './contacts/contactOperationRoutes.js';
import { contactCrudRoutes } from './contacts/contactCrudRoutes.js';
import { contactSavedReportRoutes } from './contacts/savedReportRoutes.js';
import { contactLookupRoutes } from './contacts/contactLookupRoutes.js';
import { contactSetupConfigRoutes } from './contacts/contactSetupConfigRoutes.js';
import { requireContactPermission, sanitizeForUser } from './contacts/contactRouteHelpers.js';

let backgroundJobRunnersReady = false;

function ensureBackgroundJobRunners(): void {
  if (backgroundJobRunnersReady) return;
  registerDefaultBackgroundJobRunners();
  backgroundJobRunnersReady = true;
}

function isContactsPageResult(result: Contact[] | ContactsListPageResult): result is ContactsListPageResult {
  return !Array.isArray(result) && Array.isArray(result.contacts);
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

  registerPaginatedListRoute(fastify, {
    collection: 'contacts',
    schema: contactsListQuerySchema,
    defaultPageSize: CONTACTS_MODULE_MANIFEST.defaultPageSize,
    errorMessagePrefix: 'contacts',
    canWriteDeletedCheck: canDeleteContacts,
    loadPageFn: (query) => contactUseCases.loadContactsPage(query),
    responseTransform: async (result: Contact[] | ContactsListPageResult, user) => {
      if (isContactsPageResult(result)) {
        return {
          ...result,
          contacts: await sanitizeForUser(result.contacts, user),
        };
      }
      return sanitizeForUser(result, user);
    },
  });

  registerCountRoute(fastify, {
    collection: 'contacts',
    loadCountFn: () => contactUseCases.countContacts(),
    errorMessagePrefix: 'contacts',
  });

  registerMetricsRoute(fastify, {
    collection: 'contacts',
    loadMetricsFn: () => contactUseCases.loadContactsCommandMetrics(),
    errorMessagePrefix: 'contact',
  });

  fastify.get('/report-analytics', async (request, reply) => {
    const user = request.user as User;
    if (!requireContactPermission(reply, user, 'read')) return;
    const parsed = parseRequest(contactsReportAnalyticsQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await contactUseCases.loadContactsReportAnalytics({
        compareYears: parsed.data.years,
        language: parsed.data.lang,
      });
      return reply.send(result);
    } catch {
      return sendDatabaseError(reply, 'Failed to load contact report analytics');
    }
  });

  registerFieldUsageRoutes(fastify, {
    canRead: canReadContacts,
    loadCount: (fieldKey) => contactUseCases.loadContactFieldUsageCount(fieldKey),
    loadCounts: (fieldKeys) => contactUseCases.loadContactFieldUsageCounts(fieldKeys),
    paramsSchema: contactFieldUsageParamsSchema,
    batchBodySchema: contactFieldUsageBatchBodySchema,
  });

  registerWidgetAggregatesRoute(fastify, {
    collection: 'contacts',
    loadAggregatesFn: (queries) => contactUseCases.loadContactsWidgetAggregates(queries),
    errorMessagePrefix: 'contact',
  });

  registerResolveRoute(fastify, {
    collection: 'contacts',
    loadByIdsFn: async (ids, request) => {
      const user = request.user as User;
      const contacts = await contactUseCases.loadContactsByIds(ids);
      return sanitizeForUser(contacts, user);
    },
    responseKey: 'contacts',
    errorMessagePrefix: 'contacts',
  });

  await fastify.register(contactOperationRoutes);
  await fastify.register(contactLookupRoutes);
  await fastify.register(contactSetupConfigRoutes);

  registerColumnPreferencesRoutes(fastify, {
    collection: 'contacts',
    objectKey: CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey,
  });

  await fastify.register(contactSavedReportRoutes);
  await fastify.register(contactGoogleSyncRoutes);
  await fastify.register(contactCrudRoutes);
}
