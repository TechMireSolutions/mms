import type { FastifyPluginAsync } from 'fastify';
import type { BackgroundJobRecord, Contact, User } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST, getDisplayName, roleHasPermission } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
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
  contactExportAuditSchema,
  contactSetupAuditSchema,
  contactsCsvExportBodySchema,
  contactsVcfExportBodySchema,
} from '../../../validation/contactSchemas.js';
import { auditContact, sanitizeOneForUser } from './contactRouteHelpers.js';
import { contactIdentityMatchBodySchema, collectContactWriteExtraFieldKeys } from '@mms/shared';
import { loadContactFieldConfig } from '../../../services/contactConfigService.js';
import { matchContactIdentityIndex } from '../../../services/contactIdentityMatchService.js';

function normalizeExportQuery(
  query: Record<string, unknown> | undefined,
  allowDeleted: boolean,
): Record<string, unknown> {
  const next = { ...(query ?? {}) };
  if (!allowDeleted) {
    delete next.includeDeleted;
  }
  return next;
}

/** Contact CSV export queue, merge, and audit logging routes. */
export const contactAuditExportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/export/csv', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactsCsvExportBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const allowDeleted = canDeleteContacts(user);
    const query = normalizeExportQuery(
      parsed.data.query as Record<string, unknown> | undefined,
      allowDeleted,
    );
    if (parsed.data.ids && parsed.data.ids.length > 0) {
      query.includeIds = parsed.data.ids.map(String);
    }

    const tenant = getRequestTenant()!;
    const userId = String(user.id);
    const jobId = parsed.data.idempotencyKey?.trim() || crypto.randomUUID();
    const existing = await getUserBackgroundJob(userId, jobId);
    if (existing) {
      return reply.status(202).send({ job: existing });
    }

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
      query,
      columns: parsed.data.columns,
      filename: parsed.data.filename,
      label,
      viewerRole: user.role,
      allowDeleted,
    });
    await auditContact(user, 'contact.export.queue', `Queued contact export "${label}"`, jobId);
    return reply.status(202).send({ job });
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
