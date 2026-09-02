import type { SessionsRepository } from '../repository/sessionsRepository.js';
import { sessionsRepository } from '../repository/sessionsRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import {
  sessionRecordSchema,
  type SessionRecord,
} from '../../validation/sessionSchemas.js';
import {
  normalizeStoredSession,
  type SessionsListQuery,
  type Session,
  type SessionsWidgetQuery,
  type SessionsReportAggregates,
} from '@mms/shared';

/**
 * Sessions use-cases — composition root binding a {@link SessionsRepository} to
 * every operation. Production uses the default Drizzle-backed `sessionsUseCases`;
 * tests can pass a fake repository to exercise orchestration in isolation.
 */
export function createSessionsUseCases(repo: SessionsRepository = sessionsRepository) {
  const crud = createGenericRelationalService<SessionRecord>({
    repo: {
      listByWorkspace: repo.listSessionsByWorkspace,
      findById: repo.findSessionById,
      save: repo.saveSession,
    },
    schema: sessionRecordSchema,
    websocketCollection: 'sessions',
    idPrefix: 'sess',
    normalizeFn: normalizeStoredSession as (record: SessionRecord) => SessionRecord,
  });

  return {
    loadSessions: crud.loadAll,
    createSession: crud.create,
    updateSessionById: crud.updateById,
    deleteSessionById: crud.deleteById,
    restoreSessionById: crud.restoreById,
    bulkSoftDeleteSessions: crud.bulkDeleteByIds,
    bulkRestoreSessions: crud.bulkRestoreByIds,

    bulkUpdateSessionsStatus: async (
      ids: string[],
      status: string,
    ): Promise<{ succeeded: number; failed: number }> => {
      const tenant = getRequestTenant();
      if (!tenant) return { succeeded: 0, failed: ids.length };
      const result = await repo.bulkUpdateSessionsStatus(tenant, ids, status);
      if (result.succeeded > 0) {
        const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
        broadcastTenantUpdate(tenant, 'collection', 'sessions');
      }
      return result;
    },

    loadSessionsPage: async (query: SessionsListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          sessions: [],
          total: 0,
          page: query.page ?? 1,
          limit: query.limit ?? 12,
          hasMore: false,
        };
      }
      return repo.listSessionsPage(tenant, query);
    },

    loadSessionsByIds: async (ids: string[]): Promise<Session[]> => {
      const tenant = getRequestTenant();
      if (!tenant || ids.length === 0) return [];
      return (await repo.findSessionsByIds(tenant, ids)) as Session[];
    },

    countSessions: async (): Promise<number> => {
      const tenant = getRequestTenant();
      if (!tenant) return 0;
      return repo.countSessionsActive(tenant);
    },

    loadSessionsCommandMetrics: async () => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          total: 0,
          active: 0,
          upcoming: 0,
          completed: 0,
          cancelled: 0,
          totalEnrolled: 0,
          totalCapacity: 0,
          totalClasses: 0,
          sessionsThisWeek: 0,
          sessionsLastWeek: 0,
        };
      }
      return repo.aggregateSessionsCommandMetrics(tenant);
    },

    loadSessionsWidgetAggregates: async (
      queries: SessionsWidgetQuery[],
    ): Promise<Record<string, import('@mms/shared').SessionsWidgetAggregateResult>> => {
      const tenant = getRequestTenant();
      if (!tenant) return {};
      return repo.aggregateSessionsWidgetQueries(tenant, queries);
    },

    loadSessionsReportAggregates: async (): Promise<SessionsReportAggregates> => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return { capacity: [], enrollmentTrends: [], todaysSessions: [] };
      }
      return repo.loadSessionsReportAggregates(tenant);
    },
  };
}

export const sessionsUseCases = createSessionsUseCases();
