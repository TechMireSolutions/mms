import {
  listSessionsByWorkspace,
  findSessionById,
  findSessionsByIds,
  saveSession,
} from '../db/repositories/sessionRepository.js';
import {
  listSessionsPage,
  countSessionsActive,
  aggregateSessionsCommandMetrics,
  bulkUpdateSessionsStatusSql,
} from '../db/repositories/sessionRepositoryList.js';
import { aggregateSessionsWidgetQueries } from '../db/repositories/sessionRepositoryWidgets.js';
import { loadSessionsReportAggregatesSql } from '../db/repositories/sessionRepositoryReport.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  sessionRecordSchema,
  type SessionRecord,
} from '../validation/sessionSchemas.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import {
  normalizeStoredSession,
  type SessionsListQuery,
  type Session,
  type SessionsWidgetQuery,
  type SessionsReportAggregates,
} from '@mms/shared';

const crud = createGenericRelationalService<SessionRecord>({
  repo: {
    listByWorkspace: listSessionsByWorkspace,
    findById: findSessionById,
    save: saveSession,
  },
  schema: sessionRecordSchema,
  websocketCollection: 'sessions',
  idPrefix: 'sess',
  normalizeFn: normalizeStoredSession as (record: SessionRecord) => SessionRecord,
});

export const loadSessions = crud.loadAll;
export const createSession = crud.create;
export const updateSessionById = crud.updateById;
export const deleteSessionById = crud.deleteById;
export const restoreSessionById = crud.restoreById;
export const bulkSoftDeleteSessions = crud.bulkDeleteByIds;
export const bulkRestoreSessions = crud.bulkRestoreByIds;

export async function bulkUpdateSessionsStatus(
  ids: string[],
  status: string,
): Promise<{ succeeded: number; failed: number }> {
  const tenant = getRequestTenant();
  if (!tenant) return { succeeded: 0, failed: ids.length };
  const result = await bulkUpdateSessionsStatusSql(tenant, ids, status);
  if (result.succeeded > 0) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', 'sessions');
  }
  return result;
}

export async function loadSessionsPage(query: SessionsListQuery & { includeDeleted?: boolean }) {
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
  return listSessionsPage(tenant, query);
}

export async function loadSessionsByIds(ids: string[]): Promise<Session[]> {
  const tenant = getRequestTenant();
  if (!tenant || ids.length === 0) return [];
  const rows = await findSessionsByIds(tenant, ids);
  return rows as Session[];
}

export async function countSessions(): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  return countSessionsActive(tenant);
}

export async function loadSessionsCommandMetrics() {
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
  return aggregateSessionsCommandMetrics(tenant);
}

export async function loadSessionsWidgetAggregates(
  queries: SessionsWidgetQuery[],
): Promise<Record<string, import('@mms/shared').SessionsWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateSessionsWidgetQueries(tenant, queries);
}

export async function loadSessionsReportAggregates(): Promise<SessionsReportAggregates> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return { capacity: [], enrollmentTrends: [], todaysSessions: [] };
  }
  return loadSessionsReportAggregatesSql(tenant);
}
