import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { canDeleteCollection } from '../../services/rbacService.js';
import { ENROLLMENTS_MODULE_MANIFEST, type User } from '@mms/shared';
import { registerCountRoute, registerMetricsRoute, registerWidgetAggregatesRoute } from '../../lib/crudRouter.js';


import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { withTenant } from '../../db/tenant-context.js';
import { canReadCollection, canWriteCollection } from '../../services/rbacService.js';

import { enrollmentsUseCases } from '../../enrollments/use-cases/enrollmentsUseCases.js';
import { enrollmentExportRoutes } from './enrollments/enrollmentExportRoutes.js';
import { enrollmentReportRoutes } from './enrollments/enrollmentReportRoutes.js';
import { enrollmentSetupConfigRoutes } from './enrollments/enrollmentSetupConfigRoutes.js';

const ENROLLMENTS_COLLECTION = ENROLLMENTS_MODULE_MANIFEST.collectionKey;

/**
 * Enrollments module routes — CRUD, metrics, soft-delete, and column preferences.
 */
export default async function enrollmentsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('enrollment'));

  await fastify.register(
    async (sub) => {
      await sub.register(enrollmentSetupConfigRoutes);
      await sub.register(enrollmentExportRoutes);
      await sub.register(enrollmentReportRoutes);

      registerCountRoute(sub, {
        collection: ENROLLMENTS_COLLECTION,
        loadCountFn: enrollmentsUseCases.countEnrollments,
        errorMessagePrefix: 'enrollments',
      });

      registerMetricsRoute(sub, {
        collection: ENROLLMENTS_COLLECTION,
        loadMetricsFn: enrollmentsUseCases.loadEnrollmentsCommandMetrics,
        errorMessagePrefix: 'enrollment',
      });

      registerWidgetAggregatesRoute(sub, {
        collection: ENROLLMENTS_COLLECTION,
        loadAggregatesFn: enrollmentsUseCases.loadEnrollmentsWidgetAggregates as unknown as (
          queries: unknown[],
        ) => Promise<unknown>,
        errorMessagePrefix: 'enrollment',
      });

      sub.post<{ Params: { id: string } }>('/:id/restore', async (request, reply) => {
        const user = request.user as User;
        if (!canDeleteCollection(user, ENROLLMENTS_COLLECTION)) {
          return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
        }
        const { id } = request.params;
        try {
          const restored = await withTenant(String(request.tenant?.id), () => enrollmentsUseCases.restoreEnrollmentById(id, String(user.id)), { readOnly: false });
          if (!restored) {
            return reply.status(404).send({ type: 'not_found', message: 'Enrollment not found or not deleted' });
          }
          return reply.send({ success: true });
        } catch {
          return reply.status(500).send({ type: 'database_error', message: 'Failed to restore enrollment' });
        }
      });
    },
    { prefix: '/api/enrollments' },
  );

  const s = initServer();
  const router = s.router(rootContract.enrollments, {
    list: async ({ query, request }: any) => {
      const user = request.user as User;
      if (!canReadCollection(user, ENROLLMENTS_COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true ? true : (query?.includeDeleted === 'false' || query?.includeDeleted === false ? false : undefined);
        const result = await withTenant(String(request.tenant?.id), () => enrollmentsUseCases.loadEnrollmentsPage({ ...query, ...(includeDeleted !== undefined ? { includeDeleted } : {}) }), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list enrollments' } };
      }
    },
    get: async () => ({ status: 404 as const, body: { type: 'not_found', message: 'Not implemented' } }),
    create: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, ENROLLMENTS_COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const item = await withTenant(String(request.tenant?.id), () => enrollmentsUseCases.createEnrollment(body), { readOnly: false });
        return { status: 201 as const, body: item };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to create enrollment' } };
      }
    },
    update: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canWriteCollection(user, ENROLLMENTS_COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const updated = await withTenant(String(request.tenant?.id), () => enrollmentsUseCases.updateEnrollmentById(id, body), { readOnly: false });
        if (!updated) return { status: 404 as const, body: { type: 'not_found', message: 'Enrollment not found' } };
        return { status: 200 as const, body: updated };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to update enrollment' } };
      }
    },
    delete: async ({ params: { id }, body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, ENROLLMENTS_COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const deleted = await withTenant(String(request.tenant?.id), () => enrollmentsUseCases.deleteEnrollmentById(id, String(user.id), body?.deletionReason), { readOnly: false });
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Enrollment not found' } };
        return { status: 200 as const, body: { success: true } };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete enrollment' } };
      }
    },
    bulkDelete: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, ENROLLMENTS_COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => enrollmentsUseCases.bulkSoftDeleteEnrollments(body.ids.map(String), String(user.id), body.deletionReason), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete enrollments' } };
      }
    },
    bulkRestore: async ({ body, request }: any) => {
      const user = request.user as User;
      if (!canDeleteCollection(user, ENROLLMENTS_COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String(request.tenant?.id), () => enrollmentsUseCases.bulkRestoreEnrollments(body.ids.map(String)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore enrollments' } };
      }
    },
    // (typed as any because handler impls take loosely-typed ({ query, body, request }: any);
    //  tracked by the separate contract-router signature refactor)
  } as any);

  await fastify.register(s.plugin(router));
}
