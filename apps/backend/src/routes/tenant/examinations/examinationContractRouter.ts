import type { FastifyPluginAsync } from 'fastify';
import type { User, WidgetQuery } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  loadExams,
  loadExamsPage,
  loadExamResults,
  bulkSoftDeleteExams,
  bulkRestoreExams,
  loadExaminationsWidgetAggregates,
} from '../../../services/examinationService.js';

const s = initServer();

export const examinationContractRouter: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.examinations, {
    listExams: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'exams')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true;
      if (includeDeleted && !canDeleteCollection(user, 'exams')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        if (query?.page !== undefined || query?.limit !== undefined || query?.search !== undefined || query?.status !== undefined) {
          const result = await withTenant(String(request.tenant?.id), () => loadExamsPage({ ...query, includeDeleted }), { readOnly: true });
          return { status: 200 as const, body: result };
        }
        const exams = await withTenant(String(request.tenant?.id), () => loadExams({ includeDeleted }), { readOnly: true });
        return { status: 200 as const, body: { exams } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list exams' } };
      }
    },
    bulkDeleteExams: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'exams')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          bulkSoftDeleteExams(body.ids.map(String), String(user.id), body.deletionReason),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete exams' } };
      }
    },
    bulkRestoreExams: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, 'exams')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () =>
          bulkRestoreExams(body.ids.map(String)),
          { readOnly: false },
        );
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore exams' } };
      }
    },
    listResults: async ({ request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'exam_results')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadExamResults(), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list exam results' } };
      }
    },
    widgetAggregates: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'exams')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String(request.tenant?.id), () => loadExaminationsWidgetAggregates(body.widgets as WidgetQuery[]), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load widget aggregates' } };
      }
    },
    // (typed as any because handler impls take loosely-typed ({ query, body, request }: any);
    //  tracked by the separate contract-router signature refactor)
  } as any);

  await fastify.register(s.plugin(router));
};
