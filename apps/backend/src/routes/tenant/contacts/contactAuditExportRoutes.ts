import type { FastifyPluginAsync } from 'fastify';
import type { BackgroundJobRecord, Contact, User } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST, getDisplayName, roleHasPermission } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { enqueueBackgroundJob } from '../../../services/backgroundJobWorkerService.js';
import { canReadContacts, canWriteContacts, canDeleteContacts } from '../../../services/rbacService.js';
import { mergeContactsById } from '../../../services/contactService.js';
import {
  contactExportAuditSchema,
  contactMergeAuditSchema,
  contactMergeBodySchema,
  contactSetupAuditSchema,
  contactsCsvExportBodySchema,
} from '../../../validation/contactSchemas.js';
import { auditContact, sanitizeOneForUser } from './contactRouteHelpers.js';

/** Contact CSV export queue, merge, and audit logging routes. */
export const contactAuditExportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/export/csv', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactsCsvExportBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const tenant = getRequestTenant()!;
    const jobId = crypto.randomUUID();
    const userId = String(user.id);
    const label = parsed.data.label?.trim() || 'Exporting contacts…';
    const runningJob: BackgroundJobRecord = {
      id: jobId,
      moduleId: CONTACTS_MODULE_MANIFEST.moduleId,
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

  fastify.post('/merge', {
    bodyLimit: 1048576,
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user) || !canDeleteContacts(user)) {
      return sendForbidden(reply);
    }

    const parsed = parseRequest(contactMergeBodySchema, request.body);
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
    if (!roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.setupWrite)) {
      return sendForbidden(reply);
    }

    const parsed = parseRequest(contactSetupAuditSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    await auditContact(user, 'contact.setup', parsed.data.summary, `setup:${parsed.data.area}`);
    return reply.send({ success: true });
  });
};
