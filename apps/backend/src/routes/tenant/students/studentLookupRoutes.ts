import type { FastifyPluginAsync } from 'fastify';
import {
  STUDENTS_MODULE_MANIFEST,
  roleHasPermission,
  studentLookupKindParamsSchema,
  studentLookupPutBodySchema,
  type User,
} from '@mms/shared';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { canReadCollection } from '../../../services/rbacService.js';
import { recordAudit } from '../../../services/auditService.js';
import {
  loadStudentLookupsMap,
  replaceStudentLookupKind,
} from '../../../services/studentLookupsService.js';

/** Students Setup lookup option lists (typed `student_lookups`). */
export const studentLookupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/lookups', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    try {
      const lookups = await loadStudentLookupsMap();
      return reply.send({ lookups });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load student lookups', error);
    }
  });

  fastify.put('/lookups/:kind', async (request, reply) => {
    const user = request.user as User;
    if (!roleHasPermission(user.role, STUDENTS_MODULE_MANIFEST.permissions.setupWrite)) {
      return sendForbidden(reply);
    }

    const params = parseRequest(studentLookupKindParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const body = parseRequest(studentLookupPutBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const { kind } = params.data;
    try {
      const saved = await replaceStudentLookupKind(kind, body.data.items);
      await recordAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'student.lookups',
        entityType: 'collection',
        entityId: `lookups:${kind}`,
        summary: `Updated student lookup kind "${kind}" (${saved.length} items)`,
      });
      return reply.send({ success: true, kind, items: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save student lookups', error);
    }
  });
};
