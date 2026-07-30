import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { Contact, ContactsListPageResult, User } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { canDeleteContacts, canReadContacts } from '../../services/rbacService.js';
import {
  contactFieldUsageParamsSchema,
  contactsListQuerySchema,
  contactsReportAnalyticsQuerySchema,
} from '../../validation/contactSchemas.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { registerDefaultBackgroundJobRunners } from '../../services/backgroundJobRunnerService.js';
import {
  loadContacts,
  loadContactsPage,
  loadContactsCommandMetrics,
  loadContactsReportAnalytics,
  loadContactsWidgetAggregates,
  loadContactsByIds,
  loadContactFieldUsageCount,
} from '../../services/contactService.js';
import { sendForbidden, sendDatabaseError } from '../../lib/httpErrors.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerPaginatedListRoute,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';
import { contactGoogleSyncRoutes } from './contacts/googleSyncRoutes.js';
import { contactOperationRoutes } from './contacts/contactOperationRoutes.js';
import { contactCrudRoutes } from './contacts/contactCrudRoutes.js';
import { contactSavedReportRoutes } from './contacts/savedReportRoutes.js';
import { sanitizeForUser } from './contacts/contactRouteHelpers.js';

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
    loadPageFn: (query) => loadContactsPage(query),
    loadAllFn: (options) => loadContacts(options),
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
    loadAllFn: loadContacts,
    errorMessagePrefix: 'contacts',
  });

  registerMetricsRoute(fastify, {
    collection: 'contacts',
    loadMetricsFn: loadContactsCommandMetrics,
    errorMessagePrefix: 'contact',
  });

  fastify.get('/report-analytics', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    const parsed = parseRequest(contactsReportAnalyticsQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const result = await loadContactsReportAnalytics({ compareYears: parsed.data.years });
      return reply.send(result);
    } catch {
      return sendDatabaseError(reply, 'Failed to load contact report analytics');
    }
  });

  fastify.get('/field-usage/:fieldKey', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    const params = parseRequest(contactFieldUsageParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const count = await loadContactFieldUsageCount(params.data.fieldKey);
      return reply.send({ count });
    } catch {
      return sendDatabaseError(reply, 'Failed to load field usage');
    }
  });

  registerWidgetAggregatesRoute(fastify, {
    collection: 'contacts',
    loadAggregatesFn: loadContactsWidgetAggregates,
    errorMessagePrefix: 'contact',
  });

  registerResolveRoute(fastify, {
    collection: 'contacts',
    loadByIdsFn: async (ids, request) => {
      const user = request.user as User;
      const contacts = await loadContactsByIds(ids);
      return sanitizeForUser(contacts, user);
    },
    responseKey: 'contacts',
    errorMessagePrefix: 'contacts',
  });

  await fastify.register(contactOperationRoutes);

  registerColumnPreferencesRoutes(fastify, {
    collection: 'contacts',
    objectKey: CONTACTS_MODULE_MANIFEST.columnPreferencesObjectKey,
  });

  await fastify.register(contactSavedReportRoutes);
  await fastify.register(contactGoogleSyncRoutes);
  await fastify.register(contactCrudRoutes);
}
