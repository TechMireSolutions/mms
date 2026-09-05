import type { EnrollmentsRepository } from '../repository/enrollmentsRepository.js';
import { enrollmentsRepository } from '../repository/enrollmentsRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import { enrollmentRecordSchema, type EnrollmentRecord } from '../../validation/enrollmentSchemas.js';
import {
  EMPTY_ENROLLMENTS_REPORT_AGGREGATES,
  normalizeEnrollmentsReportComparisonQuery,
  type EnrollmentsListQuery,
  type EnrollmentsCommandMetricsSnapshot,
  type EnrollmentsReportAggregates,
  type EnrollmentsReportComparisonQuery,
  type EnrollmentsWidgetQuery,
} from '@mms/shared';

/**
 * Enrollments use-cases — composition root binding an {@link EnrollmentsRepository}
 * to every operation. Production uses the default Drizzle-backed
 * `enrollmentsUseCases`; tests can pass a fake repository to exercise
 * orchestration in isolation.
 */
export function createEnrollmentsUseCases(repo: EnrollmentsRepository = enrollmentsRepository) {
  const crud = createGenericRelationalService<EnrollmentRecord>({
    repo: {
      listByWorkspace: repo.listEnrollmentsByWorkspace,
      findById: repo.findEnrollmentById,
      save: repo.saveEnrollment,
    },
    schema: enrollmentRecordSchema,
    websocketCollection: 'enrollments',
    idPrefix: 'enr',
  });

  return {
    createEnrollment: async (record: EnrollmentRecord) => {
      const created = await crud.create(record);
      const { maybeGenerateInvoiceForEnrollment } = await import(
        '../../finance/use-cases/financeInvoiceGenerationUseCases.js'
      );
      return maybeGenerateInvoiceForEnrollment(created);
    },
    updateEnrollmentById: crud.updateById,
    deleteEnrollmentById: crud.deleteById,
    restoreEnrollmentById: crud.restoreById,
    bulkSoftDeleteEnrollments: crud.bulkDeleteByIds,
    bulkRestoreEnrollments: crud.bulkRestoreByIds,

    loadEnrollmentsPage: async (query: EnrollmentsListQuery & { includeDeleted?: boolean }) => {
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
      return repo.listEnrollmentsPage(tenant, query);
    },

    loadEnrollmentsByIds: async (ids: string[]): Promise<EnrollmentRecord[]> => {
      const tenant = getRequestTenant();
      if (!tenant || ids.length === 0) return [];
      return repo.findEnrollmentsByIds(tenant, ids);
    },

    countEnrollments: async (): Promise<number> => {
      const tenant = getRequestTenant();
      if (!tenant) return 0;
      return repo.countEnrollmentsActive(tenant);
    },

    loadEnrollmentsCommandMetrics: async (): Promise<EnrollmentsCommandMetricsSnapshot> => {
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
      return repo.aggregateEnrollmentsCommandMetrics(tenant);
    },

    loadEnrollmentsWidgetAggregates: async (
      queries: EnrollmentsWidgetQuery[],
    ): Promise<Record<string, import('@mms/shared').EnrollmentsWidgetAggregateResult>> => {
      const tenant = getRequestTenant();
      if (!tenant) return {};
      return repo.aggregateEnrollmentsWidgetQueries(tenant, queries);
    },

    loadEnrollmentsReportAggregates: async (
      comparisonQuery?: EnrollmentsReportComparisonQuery,
    ): Promise<EnrollmentsReportAggregates> => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return EMPTY_ENROLLMENTS_REPORT_AGGREGATES;
      }
      const normalized = normalizeEnrollmentsReportComparisonQuery(comparisonQuery);
      return repo.loadEnrollmentsReportAggregates(tenant, normalized);
    },
  };
}

export const enrollmentsUseCases = createEnrollmentsUseCases();
