import type { FastifyPluginAsync } from 'fastify';
import type { BackgroundJobRecord, User } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST, roleHasPermission } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { enqueueBackgroundJob } from '../../../services/backgroundJobWorkerService.js';
import { canReadContacts, canWriteContacts } from '../../../services/rbacService.js';
import {
  contactExportAuditSchema,
  contactMergeAuditSchema,
  contactSetupAuditSchema,
  contactsCsvExportBodySchema,
} from '../../../validation/contactSchemas.js';
import { auditContact } from './contactRouteHelpers.js';

/** Contact CSV export queue and audit logging routes. */
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
    if (!roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.setupWrite)) return sendForbidden(reply);

    const parsed = parseRequest(contactSetupAuditSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    await auditContact(user, 'contact.setup', parsed.data.summary, `setup:${parsed.data.area}`);
    return reply.send({ success: true });
  });
};
