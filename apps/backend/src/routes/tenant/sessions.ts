import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { initServer } from '@ts-rest/fastify';
import { withTenant } from '../../db/tenant-context.js';
import { rootContract } from '@mms/shared';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import { canDeleteCollection, canWriteCollection, canReadCollection } from '../../services/rbacService.js';
import {
  createSession,
  deleteSessionById,
  restoreSessionById,
  bulkSoftDeleteSessions,
  bulkRestoreSessions,
  bulkUpdateSessionsStatus,
  loadSessionsPage,
  countSessions,
  loadSessionsCommandMetrics,
  loadSessionsWidgetAggregates,
  updateSessionById,
} from '../../services/sessionService.js';
import type { User } from '@mms/shared';
import { SESSIONS_MODULE_MANIFEST } from '@mms/shared';

import { registerStandardTenantRoutes } from '../../lib/crudRouter.js';
import { sessionRecordSchema } from '../../validation/sessionSchemas.js';

import { sessionExportRoutes } from './sessions/sessionExportRoutes.js';
import { sessionSetupConfigRoutes } from './sessions/sessionSetupConfigRoutes.js';
import { sessionLookupRoutes } from './sessions/sessionLookupRoutes.js';
import { sessionReportRoutes } from './sessions/sessionReportRoutes.js';

const COLLECTION = SESSIONS_MODULE_MANIFEST.collectionKey;

/**
 * Server-first sessions resource routes (TanStack Query on FE).
 */
export default async function sessionsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('sessions'));

  await fastify.register(
    async (sub) => {
      await sub.register(sessionSetupConfigRoutes);
      await sub.register(sessionLookupRoutes);
      await sub.register(sessionExportRoutes);
      await sub.register(sessionReportRoutes);

      registerStandardTenantRoutes(sub, {
        collection: COLLECTION,
        schema: sessionRecordSchema,
        defaultPageSize: SESSIONS_MODULE_MANIFEST.defaultPageSize,
        errorMessagePrefix: 'sessions',
        nameSingular: 'session',
        namePlural: 'sessions',
        loadCountFn: countSessions,
        loadMetricsFn: loadSessionsCommandMetrics,
        loadWidgetAggregatesFn: loadSessionsWidgetAggregates as unknown as (queries: unknown[]) => Promise<unknown>,
        updateFn: updateSessionById,
        deleteFn: deleteSessionById,
        restoreFn: restoreSessionById,

        customPostRoute: true,
      });
    },
    { prefix: '/api/sessions' },
  );

  const s = initServer();
  const sessionsBulkRouter = s.router(rootContract.sessions, {
    list: async ({ query, request }: any) => {
      const user = (request as any).user as User;
      if (!canReadCollection(user, COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true ? true : (query?.includeDeleted === 'false' || query?.includeDeleted === false ? false : undefined);
      if (includeDeleted && !canDeleteCollection(user, COLLECTION)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await withTenant(String((request as any).tenant?.id), () => loadSessionsPage({ ...query, ...(includeDeleted !== undefined ? { includeDeleted } : {}) }), { readOnly: true });
        return { status: 200 as const, body: result };
      } catch (error: unknown) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list sessions' } as any };
      }
    },
    create: async ({ body, request }: any) => {
      const user = (request as any).user as User;
      if (!canWriteCollection(user, COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const item = await withTenant(String((request as any).tenant?.id), () => createSession(body as Parameters<typeof createSession>[0]), { readOnly: false });
        return { status: 201 as const, body: { session: item } };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create session';
        return { status: 500 as const, body: { type: 'database_error', message } as any };
      }
    },
    bulkDelete: async ({ body, request }: any) => {
      const user = (request as any).user as User;
      if (!canDeleteCollection(user, COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String((request as any).tenant?.id), () => bulkSoftDeleteSessions(body.ids.map(String), String(user.id), body.deletionReason), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk delete sessions' } as any };
      }
    },
    bulkStatus: async ({ body, request }: any) => {
      const user = (request as any).user as User;
      if (!canWriteCollection(user, COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String((request as any).tenant?.id), () => bulkUpdateSessionsStatus(body.ids.map(String), body.status), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk update session status' } as any };
      }
    },
    bulkRestore: async ({ body, request }: any) => {
      const user = (request as any).user as User;
      if (!canDeleteCollection(user, COLLECTION))
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      try {
        const result = await withTenant(String((request as any).tenant?.id), () => bulkRestoreSessions(body.ids.map(String)), { readOnly: false });
        return { status: 200 as const, body: { success: true, ...result } };
      } catch {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to bulk restore sessions' } as any };
      }
    },
  } as any);

  await fastify.register(s.plugin(sessionsBulkRouter));
}
