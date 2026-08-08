import {
  listEnrollmentsByWorkspace,
  findEnrollmentById,
  findEnrollmentsByIds,
  saveEnrollment,
} from '../db/repositories/enrollmentRepository.js';
import {
  listEnrollmentsPage,
  countEnrollmentsActive,
  aggregateEnrollmentsCommandMetrics,
} from '../db/repositories/enrollmentRepositoryList.js';
import { loadEnrollmentsReportAggregatesSql } from '../db/repositories/enrollmentRepositoryReport.js';
import { aggregateEnrollmentsWidgetQueries } from '../db/repositories/enrollmentRepositoryWidgets.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { enrollmentRecordSchema } from '../validation/enrollmentSchemas.js';
import type { EnrollmentRecord } from '../validation/enrollmentSchemas.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  EMPTY_ENROLLMENTS_REPORT_AGGREGATES,
  normalizeEnrollmentsReportComparisonQuery,
  type EnrollmentsListQuery,
  type EnrollmentsCommandMetricsSnapshot,
  type EnrollmentsReportAggregates,
  type EnrollmentsReportComparisonQuery,
  type EnrollmentsWidgetQuery,
} from '@mms/shared';

const crud = createGenericRelationalService<EnrollmentRecord>({
  repo: {
    listByWorkspace: listEnrollmentsByWorkspace,
    findById: findEnrollmentById,
    save: saveEnrollment,
  },
  schema: enrollmentRecordSchema,
  websocketCollection: 'enrollments',
  idPrefix: 'enr',
});

export const loadEnrollments = crud.loadAll;
export const createEnrollment = crud.create;
export const updateEnrollmentById = crud.updateById;
export const deleteEnrollmentById = crud.deleteById;
export const restoreEnrollmentById = crud.restoreById;
export const bulkSoftDeleteEnrollments = crud.bulkDeleteByIds;
export const bulkRestoreEnrollments = crud.bulkRestoreByIds;

export async function loadEnrollmentsPage(query: EnrollmentsListQuery & { includeDeleted?: boolean }) {
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      enrollments: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      hasMore: false,
    };
  }
  return listEnrollmentsPage(tenant, query);
}

export async function loadEnrollmentsByIds(ids: string[]): Promise<EnrollmentRecord[]> {
  const tenant = getRequestTenant();
  if (!tenant || ids.length === 0) return [];
  return findEnrollmentsByIds(tenant, ids);
}

export async function countEnrollments(): Promise<number> {
  const tenant = getRequestTenant();
  if (!tenant) return 0;
  return countEnrollmentsActive(tenant);
}

export async function loadEnrollmentsCommandMetrics(): Promise<EnrollmentsCommandMetricsSnapshot> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      revenue: 0,
      newThisPeriod: 0,
    };
  }
  return aggregateEnrollmentsCommandMetrics(tenant);
}

export async function loadEnrollmentsWidgetAggregates(
  queries: EnrollmentsWidgetQuery[],
): Promise<Record<string, import('@mms/shared').EnrollmentsWidgetAggregateResult>> {
  const tenant = getRequestTenant();
  if (!tenant) return {};
  return aggregateEnrollmentsWidgetQueries(tenant, queries);
}

export async function loadEnrollmentsReportAggregates(
  comparisonQuery?: EnrollmentsReportComparisonQuery,
): Promise<EnrollmentsReportAggregates> {
  const tenant = getRequestTenant();
  if (!tenant) {
    return EMPTY_ENROLLMENTS_REPORT_AGGREGATES;
  }
  const normalized = normalizeEnrollmentsReportComparisonQuery(comparisonQuery);
  return loadEnrollmentsReportAggregatesSql(tenant, normalized);
}
