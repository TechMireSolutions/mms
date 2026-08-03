import type { FastifyPluginAsync } from 'fastify';
import type { BackgroundJobRecord, Contact, User } from '@mms/shared';
import { CONTACTS_MODULE_MANIFEST } from '@mms/shared';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { countContactDuplicateMatches } from '../../../services/contactDuplicateScanService.js';
import {
  enqueueBackgroundJob,
  getUserBackgroundJob,
} from '../../../services/backgroundJobWorkerService.js';
import {
  loadContactDuplicatePairsPage,
  prepareContactRecord,
} from '../../../services/contactService.js';
import { canReadContacts, canWriteContacts } from '../../../services/rbacService.js';
import {
  buildContactDuplicateCheckBodySchema,
  contactsDuplicatesQuerySchema,
  contactsDuplicateScanBodySchema,
} from '../../../validation/contactSchemas.js';
import { loadContactFieldConfig } from '../../../services/contactConfigService.js';
import { collectContactWriteExtraFieldKeys } from '@mms/shared';
import { sanitizeForUser } from './contactRouteHelpers.js';

/** Contact duplicate check, pairs list, and background scan routes. */
export const contactDuplicateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/duplicate-check', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteContacts(user)) return sendForbidden(reply);
    const fieldConfig = await loadContactFieldConfig();
    const checkSchema = buildContactDuplicateCheckBodySchema(
      collectContactWriteExtraFieldKeys(fieldConfig),
    );
    const parsed = parseRequest(checkSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    try {
      const prepared = await prepareContactRecord(parsed.data.contact as Contact);
      const matchCount = await countContactDuplicateMatches(prepared);
      return reply.send({ matchCount });
    } catch {
      return sendDatabaseError(reply, 'Failed to check contact duplicates');
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
      return sendDatabaseError(reply, 'Failed to load duplicate pairs');
    }
  });

  fastify.post('/duplicates/scan', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);

    const parsed = parseRequest(contactsDuplicateScanBodySchema, request.body ?? {});
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const tenant = getRequestTenant()!;
    const userId = String(user.id);
    const jobId = parsed.data.idempotencyKey?.trim() || crypto.randomUUID();
    const existing = await getUserBackgroundJob(userId, jobId);
    if (existing) {
      return reply.status(202).send({ job: existing });
    }

    const label = parsed.data.label?.trim() || 'duplicate-scan';
    const runningJob: BackgroundJobRecord = {
      id: jobId,
      moduleId: CONTACTS_MODULE_MANIFEST.moduleId,
      kind: 'duplicate-scan',
      status: 'running',
      label,
      createdAt: new Date().toISOString(),
    };

    const job = await enqueueBackgroundJob(tenant, userId, runningJob, {});
    return reply.status(202).send({ job });
  });
};
