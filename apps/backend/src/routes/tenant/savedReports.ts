import type { FastifyPluginAsync } from 'fastify';
import {
  rootContract,
  roleHasPermission,
  type GenericSavedReportCategory,
  type Permission,
  type User,
  ACCOUNTING_MODULE_MANIFEST,
  ATTENDANCE_MODULE_MANIFEST,
  ENROLLMENTS_MODULE_MANIFEST,
  EXAMINATIONS_MODULE_MANIFEST,
  FINANCE_MODULE_MANIFEST,
  HASANAT_MODULE_MANIFEST,
  MESSAGING_MODULE_MANIFEST,
  OBLIGATIONS_MODULE_MANIFEST,
  QUESTION_BANK_MODULE_MANIFEST,
  SESSIONS_MODULE_MANIFEST,
  STUDENTS_MODULE_MANIFEST,
  TEACHERS_MODULE_MANIFEST,
  USERS_MODULE_MANIFEST,
} from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { withTenant } from '../../db/tenant-context.js';
import {
  createSavedReport,
  deleteSavedReport,
  listSavedReports,
  runSavedReport,
} from '../../services/savedReportsService.js';
import { recordAudit } from '../../services/auditService.js';

const s = initServer();

const REPORT_PERMISSION_BY_CATEGORY = {
  students: STUDENTS_MODULE_MANIFEST.permissions.reports,
  teachers: TEACHERS_MODULE_MANIFEST.permissions.reports,
  attendance: ATTENDANCE_MODULE_MANIFEST.permissions.reports,
  finance: FINANCE_MODULE_MANIFEST.permissions.reports,
  financial: FINANCE_MODULE_MANIFEST.permissions.reports,
  examinations: EXAMINATIONS_MODULE_MANIFEST.permissions.reports,
  questionBank: QUESTION_BANK_MODULE_MANIFEST.permissions.reports,
  hasanat: HASANAT_MODULE_MANIFEST.permissions.reports,
  sessions: SESSIONS_MODULE_MANIFEST.permissions.reports,
  faculty: USERS_MODULE_MANIFEST.permissions.reports,
  accounting: ACCOUNTING_MODULE_MANIFEST.permissions.reports,
  enrollments: ENROLLMENTS_MODULE_MANIFEST.permissions.reports,
  obligations: OBLIGATIONS_MODULE_MANIFEST.permissions.reports,
  messaging: MESSAGING_MODULE_MANIFEST.permissions.reports,
  users: USERS_MODULE_MANIFEST.permissions.reports,
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

const savedReportsRouter = s.router(rootContract.savedReports, {
  list: async ({ query, request }: any) => {
    const user = request.user as User;
    if (!canUseSavedReports(user, query.category)) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
    }
    try {
      const reports = await withTenant(String(request.tenant?.id), () => listSavedReports(query.category, String(user.id)), { readOnly: true });
      return { status: 200 as const, body: { reports } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list saved reports' } };
    }
  },
  create: async ({ body, request }: any) => {
    const user = request.user as User;
    if (!canUseSavedReports(user, body.category)) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
    }
    try {
      const report = await withTenant(String(request.tenant?.id), () => createSavedReport({
        ...body,
        createdBy: String(user.id),
        createdByName: user.name || user.email,
      }), { readOnly: false });
      await auditSavedReport(user, 'create', body.category, report.id, `Saved report "${report.name}"`);
      return { status: 201 as const, body: { report } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to save report' } };
    }
  },
  delete: async ({ params: { id }, query, request }: any) => {
    const user = request.user as User;
    if (!canUseSavedReports(user, query.category)) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
    }
    try {
      const deleted = await withTenant(String(request.tenant?.id), () => deleteSavedReport(id, query.category, String(user.id)), { readOnly: false });
      if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Saved report not found' } };
      await auditSavedReport(user, 'delete', query.category, id, `Deleted saved report ${id}`);
      return { status: 200 as const, body: { success: true } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete saved report' } };
    }
  },
  run: async ({ params: { id }, query, request }: any) => {
    const user = request.user as User;
    if (!canUseSavedReports(user, query.category)) {
      return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
    }
    try {
      const report = await withTenant(String(request.tenant?.id), () => runSavedReport(id, query.category, String(user.id)), { readOnly: true });
      if (!report) return { status: 404 as const, body: { type: 'not_found', message: 'Saved report not found' } };
      await auditSavedReport(user, 'run', query.category, report.id, `Ran saved report "${report.name}"`);
      return { status: 200 as const, body: { report } };
    } catch {
      return { status: 500 as const, body: { type: 'database_error', message: 'Failed to run saved report' } };
    }
  },
  // (typed as any because handler impls take loosely-typed ({ query, body, request }: any);
  //  tracked by the separate contract-router signature refactor)
} as any);

/**
 * Generic saved-report preset routes — migrated to @ts-rest contract router (Phase 3).
 */
export default async function savedReportsRoutes(
  fastify: Parameters<FastifyPluginAsync>[0],
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  await fastify.register(s.plugin(savedReportsRouter));
}

