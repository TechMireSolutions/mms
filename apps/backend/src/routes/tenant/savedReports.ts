import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
  ATTENDANCE_MODULE_MANIFEST,
  EXAMINATIONS_MODULE_MANIFEST,
  FINANCE_MODULE_MANIFEST,
  genericSavedReportCreateSchema,
  genericSavedReportIdParamsSchema,
  genericSavedReportListQuerySchema,
  HASANAT_MODULE_MANIFEST,
  QUESTION_BANK_MODULE_MANIFEST,
  roleHasPermission,
  SESSIONS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  TEACHERS_MODULE_MANIFEST,
  USERS_MODULE_MANIFEST,
  type GenericSavedReportCategory,
  type Permission,
  type User,
} from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import {
  createSavedReport,
  deleteSavedReport,
  listSavedReports,
  runSavedReport,
} from '../../services/savedReportsService.js';
import { recordAudit } from '../../services/auditService.js';

const REPORT_PERMISSION_BY_CATEGORY = {
  students: STUDENTS_MODULE_MANIFEST.permissions.reports,
  teachers: TEACHERS_MODULE_MANIFEST.permissions.reports,
  attendance: ATTENDANCE_MODULE_MANIFEST.permissions.reports,
  financial: FINANCE_MODULE_MANIFEST.permissions.reports,
  examinations: EXAMINATIONS_MODULE_MANIFEST.permissions.reports,
  questionBank: QUESTION_BANK_MODULE_MANIFEST.permissions.reports,
  hasanat: HASANAT_MODULE_MANIFEST.permissions.reports,
  sessions: SESSIONS_MODULE_MANIFEST.permissions.reports,
  faculty: USERS_MODULE_MANIFEST.permissions.reports,
} satisfies Record<GenericSavedReportCategory, Permission>;

function canUseSavedReports(user: User, category: GenericSavedReportCategory): boolean {
  return roleHasPermission(user.role, REPORT_PERMISSION_BY_CATEGORY[category]);
}

async function auditSavedReport(
  user: User,
  action: 'create' | 'delete' | 'run',
  category: GenericSavedReportCategory,
  reportId: string,
  summary: string,
): Promise<void> {
  await recordAudit({
    userId: user.id,
    userEmail: user.email,
    action: `saved_report.${action}`,
    entityType: 'collection',
    entityId: reportId,
    summary: `${category}: ${summary}`,
  });
}

export default async function savedReportsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (request, reply) => {
    const query = parseRequest(genericSavedReportListQuerySchema, request.query);
    if (!query.ok) return replyValidationError(reply, query.message);
    const user = request.user as User;
    if (!canUseSavedReports(user, query.data.category)) return sendForbidden(reply);

    try {
      const reports = await listSavedReports(query.data.category, String(user.id));
      return reply.send({ reports });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to list saved reports', error);
    }
  });

  fastify.post('/', async (request, reply) => {
    const body = parseRequest(genericSavedReportCreateSchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    const user = request.user as User;
    if (!canUseSavedReports(user, body.data.category)) return sendForbidden(reply);

    try {
      const report = await createSavedReport({
        ...body.data,
        createdBy: String(user.id),
        createdByName: user.name || user.email,
      });
      await auditSavedReport(user, 'create', body.data.category, report.id, `Saved report "${report.name}"`);
      return reply.status(201).send({ report });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save report', error);
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    const params = parseRequest(genericSavedReportIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const query = parseRequest(genericSavedReportListQuerySchema, request.query);
    if (!query.ok) return replyValidationError(reply, query.message);
    const user = request.user as User;
    if (!canUseSavedReports(user, query.data.category)) return sendForbidden(reply);

    try {
      const deleted = await deleteSavedReport(
        params.data.id,
        query.data.category,
        String(user.id),
      );
      if (!deleted) return sendNotFound(reply, 'Saved report not found');
      await auditSavedReport(
        user,
        'delete',
        query.data.category,
        params.data.id,
        `Deleted saved report ${params.data.id}`,
      );
      return reply.send({ success: true });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to delete saved report', error);
    }
  });

  fastify.post('/:id/run', async (request, reply) => {
    const params = parseRequest(genericSavedReportIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    const query = parseRequest(genericSavedReportListQuerySchema, request.query);
    if (!query.ok) return replyValidationError(reply, query.message);
    const user = request.user as User;
    if (!canUseSavedReports(user, query.data.category)) return sendForbidden(reply);

    try {
      const report = await runSavedReport(
        params.data.id,
        query.data.category,
        String(user.id),
      );
      if (!report) return sendNotFound(reply, 'Saved report not found');
      await auditSavedReport(user, 'run', query.data.category, report.id, `Ran saved report "${report.name}"`);
      return reply.send({ report });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to run saved report', error);
    }
  });
}
