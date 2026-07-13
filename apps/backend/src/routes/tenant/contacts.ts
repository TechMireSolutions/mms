import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { BackgroundJobRecord, Contact, ContactsListPageResult, User } from '@mms/shared';
import {
  CONTACTS_MODULE_CONTRACT,
  roleHasPermission,
  sanitizeContactForViewer,
  sanitizeContactsForViewer,
  summarizeContactFieldChanges,
  type ContactsSavedReportViewer,
} from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  canDeleteContacts,
  canReadContacts,
  canWriteContacts,
} from '../../services/rbacService.js';
import { getLinkedContactId } from '../../services/auth/userService.js';
import {
  contactBulkDeleteSchema,
  contactDeleteBodySchema,
  contactExportAuditSchema,
  contactGoogleSyncAuditSchema,
  contactGoogleSyncConfigSchema,
  contactGoogleSyncExchangeSchema,
  contactMergeAuditSchema,
  contactRecordSchema,
  contactSetupAuditSchema,
  contactFieldUsageParamsSchema,
  contactsDuplicatesQuerySchema,
  contactsCsvExportBodySchema,
  contactsListQuerySchema,
  contactsReportAnalyticsQuerySchema,
  contactDuplicateCheckBodySchema,
  contactsSavedReportCreateSchema,
} from '../../validation/contactSchemas.js';
import { resourceIdParamsSchema } from '../../validation/commonSchemas.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import { registerDefaultBackgroundJobRunners } from '../../services/backgroundJobRunnerService.js';
import { countContactDuplicateMatches } from '../../services/contactDuplicateScanService.js';
import { enqueueBackgroundJob } from '../../services/backgroundJobWorkerService.js';
import { recordAudit } from '../../services/auditService.js';
import {
  bulkRestoreContacts,
  bulkSoftDeleteContacts,
  getContactById,
  loadContacts,
  loadContactsPage,
  loadContactsCommandMetrics,
  loadContactsReportAnalytics,
  loadContactsWidgetAggregates,
  loadContactsByIds,
  loadContactFieldUsageCount,
  loadContactDuplicatePairsPage,
  prepareContactRecord,
  restoreContactById,
  softDeleteContactById,
  updateContactById,
  upsertContact,
} from '../../services/contactService.js';
import { loadContactFieldConfig } from '../../services/contactConfigService.js';
import {
  clearContactGoogleSyncConfig,
  clearGoogleSyncTokens,
  exchangeGoogleContactsOAuthCode,
  getContactGoogleSyncConfig,
  GoogleOAuthExchangeError,
  GoogleSyncError,
  redactGoogleSyncConfigForClient,
  runGoogleContactsSync,
  setContactGoogleSyncConfig,
} from '../../services/contactGoogleSyncService.js';
import {
  createContactsSavedReport,
  deleteContactsSavedReport,
  listContactsSavedReports,
  touchContactsSavedReportRun,
} from '../../services/contactPreferencesService.js';
import { validateContactDynamic } from '../../services/contactValidationService.js';

import { sendForbidden } from '../../lib/httpErrors.js';
import {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerPaginatedListRoute,
} from '../../lib/crudRouter.js';
import { registerColumnPreferencesRoutes } from '../../lib/columnPreferencesRouter.js';

let backgroundJobRunnersReady = false;

function ensureBackgroundJobRunners(): void {
  if (backgroundJobRunnersReady) return;
  registerDefaultBackgroundJobRunners();
  backgroundJobRunnersReady = true;
}

function savedReportViewer(user: User): ContactsSavedReportViewer {
  return {
    id: String(user.id),
    role: user.role,
    isAdmin: user.role === 'admin',
  };
}

async function sanitizeForUser(contacts: Contact[], user: User): Promise<Contact[]> {
  const fieldConfig = await loadContactFieldConfig();
  if (!fieldConfig) return contacts;
  return sanitizeContactsForViewer(contacts, user.role, {
    fields: fieldConfig.fields,
    tabs: fieldConfig.formTabs ?? [],
  });
}

async function sanitizeOneForUser(contact: Contact, user: User): Promise<Contact> {
  const fieldConfig = await loadContactFieldConfig();
  if (!fieldConfig) return contact;
  return sanitizeContactForViewer(contact, user.role, {
    fields: fieldConfig.fields,
    tabs: fieldConfig.formTabs ?? [],
  });
}

async function auditContact(
  user: User,
  action: string,
  summary: string,
  entityId = 'contacts',
): Promise<void> {
  await recordAudit({
    userId: user.id,
    userEmail: user.email,
    action,
    entityType: 'collection',
    entityId,
    summary,
  });
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

  // --- Custom GET List (Paginated) ---
  registerPaginatedListRoute(fastify, {
    collection: 'contacts',
    schema: contactsListQuerySchema,
    defaultPageSize: CONTACTS_MODULE_CONTRACT.defaultPageSize,
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

  // --- Custom GET Count ---
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
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load contact report analytics' });
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
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load field usage' });
    }
  });

  // --- Custom POST Widget Aggregates ---
  registerWidgetAggregatesRoute(fastify, {
    collection: 'contacts',
    loadAggregatesFn: loadContactsWidgetAggregates,
    errorMessagePrefix: 'contact',
  });

  // --- Custom POST Resolve ---
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

  fastify.post('/duplicate-check', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    const parsed = parseRequest(contactDuplicateCheckBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const prepared = await prepareContactRecord(parsed.data.contact as Contact);
      const matchCount = await countContactDuplicateMatches(prepared);
      return reply.send({ matchCount });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to check contact duplicates' });
    }
  });

  fastify.get('/duplicates', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    const parsed = parseRequest(contactsDuplicatesQuerySchema, request.query);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const page = await loadContactDuplicatePairsPage(parsed.data);
      const pairs = await Promise.all(
        page.pairs.map(async (pair) => ({
          ...pair,
          contacts: await sanitizeForUser(pair.contacts, user),
        })),
      );
      return reply.send({ ...page, pairs });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load duplicate pairs' });
    }
  });

  fastify.post('/duplicates/scan', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    const jobId = crypto.randomUUID();
    const userId = String(user.id);
    const runningJob: BackgroundJobRecord = {
      id: jobId,
      moduleId: CONTACTS_MODULE_CONTRACT.moduleId,
      kind: 'duplicate-scan',
      status: 'running',
      label: 'Scanning for duplicate contacts…',
      createdAt: new Date().toISOString(),
    };

    const job = await enqueueBackgroundJob(tenant, userId, runningJob, {});
    return reply.status(202).send({ job });
  });

  registerColumnPreferencesRoutes(fastify, {
    collection: 'contacts',
    objectKey: CONTACTS_MODULE_CONTRACT.columnPreferencesObjectKey,
  });

  fastify.get('/saved-reports', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    try {
      const reports = await listContactsSavedReports(savedReportViewer(user));
      return reply.send({ reports });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list saved reports' });
    }
  });

  fastify.post('/saved-reports', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    const parsed = parseRequest(contactsSavedReportCreateSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const scope = parsed.data.shareScope ?? 'private';
    if (scope === 'global' && user.role !== 'admin') {
      return sendForbidden(reply);
    }
    if (scope === 'users' && !(parsed.data.sharedWithUserIds?.length)) {
      return replyValidationError(reply, 'sharedWithUserIds required when shareScope is users');
    }
    try {
      const report = await createContactsSavedReport({
        name: parsed.data.name,
        drillDown: parsed.data.drillDown,
        createdBy: String(user.id),
        createdByName: user.name || user.email,
        shareScope: scope,
        sharedWithRoles: parsed.data.sharedWithRoles,
        sharedWithUserIds: parsed.data.sharedWithUserIds,
      });
      await auditContact(user, 'contact.saved_report.create', `Saved report "${report.name}" (${scope})`);
      return reply.status(201).send({ report });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save report' });
    }
  });

  fastify.delete('/saved-reports/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const deleted = await deleteContactsSavedReport(params.data.id, savedReportViewer(user));
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Saved report not found' });
      }
      await auditContact(user, 'contact.saved_report.delete', `Deleted saved report ${params.data.id}`);
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete saved report' });
    }
  });

  fastify.get('/google-sync', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    try {
      const config = await getContactGoogleSyncConfig(String(user.id));
      return reply.send({ config: redactGoogleSyncConfigForClient(config) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load Google sync config' });
    }
  });

  fastify.put('/google-sync', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    const parsed = parseRequest(contactGoogleSyncConfigSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const existing = await getContactGoogleSyncConfig(String(user.id));
      const { clearTokens, ...updates } = parsed.data;
      const merged = {
        ...existing,
        ...updates,
        clientSecret: updates.clientSecret ?? existing.clientSecret,
        refreshToken: updates.refreshToken ?? existing.refreshToken,
      };
      if (clearTokens) {
        merged.accessToken = undefined;
        merged.refreshToken = undefined;
      }
      const saved = await setContactGoogleSyncConfig(String(user.id), merged);
      await auditContact(user, 'contact.google_sync.update', 'Updated Google Contacts sync credentials', 'google-sync');
      return reply.send({ config: redactGoogleSyncConfigForClient(saved) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to save Google sync config' });
    }
  });

  fastify.delete('/google-sync', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    try {
      await clearContactGoogleSyncConfig(String(user.id));
      await auditContact(user, 'contact.google_sync.clear', 'Disconnected Google Contacts sync', 'google-sync');
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to clear Google sync config' });
    }
  });

  fastify.post('/google-sync/exchange', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    const parsed = parseRequest(contactGoogleSyncExchangeSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const config = await exchangeGoogleContactsOAuthCode(
        String(user.id),
        parsed.data.code,
        parsed.data.redirectUri,
      );
      await auditContact(user, 'contact.google_sync.oauth_connected', 'Google account connected via OAuth', 'google-sync');
      return reply.send({ config });
    } catch (error) {
      if (error instanceof GoogleOAuthExchangeError) {
        return reply.status(400).send({ type: 'oauth_error', message: error.message });
      }
      return reply.status(500).send({ type: 'database_error', message: 'Failed to exchange OAuth code' });
    }
  });

  fastify.post('/google-sync/run', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    try {
      const result = await runGoogleContactsSync(String(user.id));
      await auditContact(
        user,
        'contact.google_sync.sync_complete',
        `Google sync · total ${result.total} · imported ${result.imported} · skipped ${result.skipped}`,
        'google-sync',
      );
      return reply.send(result);
    } catch (error) {
      if (error instanceof GoogleSyncError) {
        if (error.code === 'session_expired') {
          await clearGoogleSyncTokens(String(user.id));
        }
        return reply.status(400).send({ type: error.code, message: error.message });
      }
      return reply.status(500).send({ type: 'database_error', message: 'Failed to sync Google contacts' });
    }
  });

  fastify.post('/google-sync/audit', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    const parsed = parseRequest(contactGoogleSyncAuditSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { action, imported, total, skipped } = parsed.data;
    const summaryParts = [action.replace(/_/g, ' ')];
    if (total != null) summaryParts.push(`total ${total}`);
    if (imported != null) summaryParts.push(`imported ${imported}`);
    if (skipped != null) summaryParts.push(`skipped ${skipped}`);
    await auditContact(
      user,
      `contact.google_sync.${action}`,
      summaryParts.join(' · '),
      'google-sync',
    );
    return reply.send({ success: true });
  });

  fastify.post('/saved-reports/:id/run', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const report = await touchContactsSavedReportRun(params.data.id, savedReportViewer(user));
      if (!report) {
        return reply.status(404).send({ type: 'not_found', message: 'Saved report not found' });
      }
      await auditContact(user, 'contact.saved_report.run', `Ran saved report "${report.name}"`);
      return reply.send({ report });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to run saved report' });
    }
  });

  fastify.post('/', {
    bodyLimit: 1048576, // 1MB limit for dynamic payloads (Rule 16.2)
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    try {
      const lang = (request.headers['accept-language'] as string) || 'en';
      await validateContactDynamic(tenant, parsed.data, lang, user.role);
    } catch (error) {
      return replyValidationError(reply, error instanceof Error ? error.message : String(error));
    }

    try {
      const { contact, created, restoredFromDelete } = await upsertContact(parsed.data as Contact);
      if (restoredFromDelete) {
        await auditContact(user, 'contact.restore', `Restored contact ${String(contact.id)} via upsert`, String(contact.id));
      } else {
        await auditContact(
          user,
          created ? 'contact.create' : 'contact.upsert',
          `${created ? 'Created' : 'Updated'} contact ${String(contact.id)}`,
          String(contact.id),
        );
      }
      return reply
        .status(created ? 201 : 200)
        .send({ success: true, contact: await sanitizeOneForUser(contact, user) });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save contact record';
      return reply.status(500).send({ type: 'database_error', message: errorMessage });
    }
  });

  fastify.get('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const contact = await getContactById(params.data.id);
      if (!contact) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found' });
      }
      return reply.send({ contact: await sanitizeOneForUser(contact, user) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to load contact' });
    }
  });

  fastify.put('/:id', {
    bodyLimit: 1048576, // 1MB limit for dynamic payloads (Rule 16.2)
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const linkedContactId = await getLinkedContactId(user.id);
    const isOwnContact =
      linkedContactId != null && String(linkedContactId) === params.data.id;
    if (!isOwnContact && !canWriteContacts(user)) {
      return sendForbidden(reply);
    }
    const body = parseRequest(contactRecordSchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    try {
      const lang = (request.headers['accept-language'] as string) || 'en';
      await validateContactDynamic(tenant, body.data, lang, user.role);
    } catch (error) {
      return replyValidationError(reply, error instanceof Error ? error.message : String(error));
    }

    try {
      const before = await getContactById(params.data.id);
      const updated = await updateContactById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      } as Contact);
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found' });
      }
      const diff = before ? summarizeContactFieldChanges(before, updated) : `Updated contact ${params.data.id}`;
      await auditContact(user, 'contact.update', diff, params.data.id);
      return reply.send({ contact: await sanitizeOneForUser(updated, user) });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
      return reply.status(500).send({ type: 'database_error', message: errorMessage });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const body = parseRequest(contactDeleteBodySchema, request.body ?? {});
    const deletionReason = body.ok ? body.data.deletionReason : undefined;

    try {
      const deleted = await softDeleteContactById(params.data.id, user.id, deletionReason);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found' });
      }
      const reasonNote = deletionReason?.trim() ? ` — ${deletionReason.trim()}` : '';
      await auditContact(user, 'contact.soft_delete', `Soft-deleted contact ${params.data.id}${reasonNote}`, params.data.id);
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete contact' });
    }
  });

  fastify.post('/export/csv', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactsCsvExportBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const tenant = getRequestTenant();
    if (!tenant) {
      return reply.status(403).send({ type: 'forbidden', message: 'Tenant required' });
    }

    const jobId = crypto.randomUUID();
    const userId = String(user.id);
    const label = parsed.data.label?.trim() || 'Exporting contacts…';

    const runningJob: BackgroundJobRecord = {
      id: jobId,
      moduleId: CONTACTS_MODULE_CONTRACT.moduleId,
      kind: 'export',
      status: 'running',
      label,
      createdAt: new Date().toISOString(),
    };

    const job = await enqueueBackgroundJob(tenant, userId, runningJob, {
      query: parsed.data.query ?? {},
      columns: parsed.data.columns,
      filename: parsed.data.filename,
      label,
      viewerRole: user.role,
    });
    await auditContact(user, 'contact.export.queue', `Queued contact export "${label}"`, jobId);
    return reply.status(202).send({ job });
  });

  fastify.post('/export-audit', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactExportAuditSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const scope = parsed.data.scope ?? 'filtered';
    await auditContact(
      user,
      'contact.export',
      `Exported ${parsed.data.count} contact(s) (${scope})`,
    );
    return reply.send({ success: true });
  });

  fastify.post('/merge-audit', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactMergeAuditSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const keepId = String(parsed.data.keepId);
    const deleteId = String(parsed.data.deleteId);
    const namePart = parsed.data.mergedName ? ` → "${parsed.data.mergedName}"` : '';
    await auditContact(
      user,
      'contact.merge',
      `Merged contact ${deleteId} into ${keepId}${namePart}`,
      keepId,
    );
    return reply.send({ success: true });
  });

  fastify.post('/setup-audit', async (request, reply) => {
    const user = request.user as User;
    if (!roleHasPermission(user.role, CONTACTS_MODULE_CONTRACT.permissions.setupWrite)) return sendForbidden(reply);

    const parsed = parseRequest(contactSetupAuditSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    await auditContact(user, 'contact.setup', parsed.data.summary, `setup:${parsed.data.area}`);
    return reply.send({ success: true });
  });

  fastify.post('/:id/restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    try {
      const restored = await restoreContactById(params.data.id, user.id);
      if (!restored) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found or not deleted' });
      }
      await auditContact(user, 'contact.restore', `Restored contact ${params.data.id}`, params.data.id);
      return reply.send({ success: true, contact: await sanitizeOneForUser(restored, user) });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to restore contact' });
    }
  });

  fastify.post('/bulk-delete', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactBulkDeleteSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    try {
      const ids = parsed.data.ids.map(String);
      const result = await bulkSoftDeleteContacts(ids, user.id, parsed.data.deletionReason);
      const reasonNote = parsed.data.deletionReason?.trim() ? ` — ${parsed.data.deletionReason.trim()}` : '';
      await auditContact(
        user,
        'contact.bulk_soft_delete',
        `Soft-deleted ${result.succeeded} contact(s); ${result.failed} failed${reasonNote}`,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to bulk delete contacts' });
    }
  });

  fastify.post('/bulk-restore', async (request, reply) => {
    const user = request.user as User;
    if (!canDeleteContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactBulkDeleteSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    try {
      const ids = parsed.data.ids.map(String);
      const result = await bulkRestoreContacts(ids, user.id);
      await auditContact(
        user,
        'contact.bulk_restore',
        `Restored ${result.succeeded} contact(s); ${result.failed} failed`,
      );
      return reply.send({ success: true, ...result });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to bulk restore contacts' });
    }
  });
  // end of contacts routes
}
