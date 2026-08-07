import type { FastifyPluginAsync } from 'fastify';
import type { BackgroundJobRecord, Contact, User } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST, getDisplayName } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { registerModuleCsvExportRoutes } from '../../../lib/registerModuleCsvExportRoutes.js';
import { registerModuleSetupAuditRoute } from '../../../lib/registerModuleSetupAuditRoute.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import {
  enqueueBackgroundJob,
  getUserBackgroundJob,
} from '../../../services/backgroundJobWorkerService.js';
import { canReadContacts, canWriteContacts, canDeleteContacts } from '../../../services/rbacService.js';
import { mergeContactsById } from '../../../services/contactService.js';
import {
  buildContactMergeBodySchema,
  contactSetupAuditSchema,
  contactsCsvExportBodySchema,
  contactsVcfExportBodySchema,
} from '../../../validation/contactSchemas.js';
import { auditContact, sanitizeOneForUser } from './contactRouteHelpers.js';
import { contactIdentityMatchBodySchema, collectContactWriteExtraFieldKeys } from '@mms/shared';
import { loadContactFieldConfig } from '../../../services/contactConfigService.js';
import { matchContactIdentityIndex } from '../../../services/contactIdentityMatchService.js';

/** Contact CSV export queue, merge, and audit logging routes. */
export const contactAuditExportRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleCsvExportRoutes(fastify, {
    canRead: canReadContacts,
    canDeleteTrash: canDeleteContacts,
    bodySchema: contactsCsvExportBodySchema,
    moduleId: CONTACTS_MODULE_MANIFEST.moduleId,
    defaultLabel: 'Exporting contacts…',
    entityNoun: 'contact',
    exportAuditAction: 'contact.export',
    queueAuditAction: 'contact.export.queue',
  });

  fastify.post('/export/vcf', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactsVcfExportBodySchema, request.body ?? {});
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const tenant = getRequestTenant()!;
    const userId = String(user.id);
    const jobId = parsed.data.idempotencyKey?.trim() || crypto.randomUUID();
    const existing = await getUserBackgroundJob(userId, jobId);
    if (existing) {
      return reply.status(202).send({ job: existing });
    }

    const label = parsed.data.label?.trim() || 'Exporting Apple Contacts…';
    const filename = parsed.data.filename?.trim() || 'contacts.vcf';
    const runningJob: BackgroundJobRecord = {
      id: jobId,
      moduleId: CONTACTS_MODULE_MANIFEST.moduleId,
      kind: 'export-vcf',
      status: 'running',
      label,
      createdAt: new Date().toISOString(),
    };

    const job = await enqueueBackgroundJob(tenant, userId, runningJob, {
      filename,
      label,
    });
    await auditContact(user, 'contact.export.queue', `Queued contact VCF export "${label}"`, jobId);
    return reply.status(202).send({ job });
  });

  fastify.post('/identity-match', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactIdentityMatchBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    try {
      const match = await matchContactIdentityIndex(parsed.data);
      return reply.send(match);
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to match contact identity index', error);
    }
  });

  fastify.post('/merge', {
    bodyLimit: 1048576,
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user) || !canDeleteContacts(user)) {
      return sendForbidden(reply);
    }

    const fieldConfig = await loadContactFieldConfig();
    const mergeSchema = buildContactMergeBodySchema(
      collectContactWriteExtraFieldKeys(fieldConfig),
    );
    const parsed = parseRequest(mergeSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const keepId = String(parsed.data.keepId);
    const deleteId = String(parsed.data.deleteId);
    try {
      const merged = await mergeContactsById(
        keepId,
        deleteId,
        parsed.data.merged as Contact | undefined,
        String(user.id),
      );
      await auditContact(
        user,
        'contact.merge',
        `Merged contact ${deleteId} into ${keepId} → "${getDisplayName(merged)}"`,
        keepId,
      );
      return reply.send({
        success: true,
        contact: await sanitizeOneForUser(merged, user),
      });
    } catch (error: unknown) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        return sendNotFound(reply, error.message);
      }
      return sendDatabaseError(reply, 'Failed to merge contacts', error);
    }
  });

  registerModuleSetupAuditRoute(fastify, {
    setupWritePermission: CONTACTS_MODULE_MANIFEST.permissions.setupWrite,
    auditAction: 'contact.setup',
    bodySchema: contactSetupAuditSchema,
  });
};
