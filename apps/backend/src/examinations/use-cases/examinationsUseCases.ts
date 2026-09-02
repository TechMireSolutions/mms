import type { ExaminationsRepository } from '../repository/examinationsRepository.js';
import { examinationsRepository } from '../repository/examinationsRepositoryAdapter.js';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { createGenericRelationalService } from '../../services/genericRelationalService.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from '../../services/tenantBulkService.js';
import {
  type Exam,
  type ExamResult,
  type ExaminationsCommandMetricsSnapshot,
  type ExaminationsListQuery,
  examListSchema,
  examResultListSchema,
  examRecordSchema,
  type WidgetQuery,
  type WidgetAggregateResult,
  type ExaminationsReportComparisonQuery,
  type ExaminationsReportAggregates,
  EMPTY_EXAMINATIONS_REPORT_AGGREGATES,
} from '@mms/shared';

const EMPTY_EXAMINATIONS_METRICS: ExaminationsCommandMetricsSnapshot = {
  total: 0,
  upcoming: 0,
  ongoing: 0,
  completed: 0,
  scheduled: 0,
  cancelled: 0,
  totalResults: 0,
  examsWithResults: 0,
  passRate: 0,
};

/**
 * Examinations use-cases — composition root binding an
 * {@link ExaminationsRepository} to every operation. Production uses the default
 * Drizzle-backed `examinationsUseCases`; tests can pass a fake repository to
 * exercise orchestration in isolation.
 */
export function createExaminationsUseCases(repo: ExaminationsRepository = examinationsRepository) {
  const examBulkService = defineTenantBulkCollectionService<Exam>(
    { listByWorkspace: repo.listExamsByWorkspace, replaceForWorkspace: repo.replaceExamsForWorkspace },
    examListSchema,
    'exams',
  );

  const examResultBulkService = defineTenantBulkCollectionService<ExamResult>(
    { listByWorkspace: repo.listExamResultsByWorkspace, replaceForWorkspace: repo.replaceExamResultsForWorkspace },
    examResultListSchema,
    'exam_results',
  );

  const examCrud = createGenericRelationalService<Exam>({
    repo: {
      listByWorkspace: repo.listExamsByWorkspace,
      findById: repo.findExamById,
      save: repo.saveExam,
    },
    schema: examRecordSchema,
    websocketCollection: 'exams',
    idPrefix: 'ex',
  });

  return {
    replaceExams: examBulkService.replace,
    replaceExamResults: examResultBulkService.replace,

    loadExams: async (options?: { includeDeleted?: boolean }): Promise<Exam[]> => {
      const rows = await examCrud.loadAll({ includeDeleted: true });
      return scopeDeleted(rows, options?.includeDeleted);
    },

    loadExamsPage: async (query: ExaminationsListQuery & { includeDeleted?: boolean }) => {
      const tenant = getRequestTenant();
      if (!tenant) {
        return {
          exams: [],
          total: 0,
          page: query.page ?? 1,
          limit: query.limit ?? 12,
          hasMore: false,
        };
      }
      return repo.listExamsPage(tenant, query);
    },

    loadExamResults: async (): Promise<ExamResult[]> => examResultBulkService.load(),

    upsertExams: (records: Exam[]) =>
      upsertWithBroadcast(examListSchema, records, repo.bulkSaveExams, 'exams'),
    upsertExamResults: (records: ExamResult[]) =>
      upsertWithBroadcast(examResultListSchema, records, repo.bulkSaveExamResults, 'exam_results'),

    deleteExamById: examCrud.deleteById,
    restoreExamById: examCrud.restoreById,
    bulkSoftDeleteExams: examCrud.bulkDeleteByIds,
    bulkRestoreExams: examCrud.bulkRestoreByIds,

    loadExaminationsCommandMetrics: async (): Promise<ExaminationsCommandMetricsSnapshot> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_EXAMINATIONS_METRICS;
      return repo.aggregateExaminationsCommandMetrics(tenant);
    },

    loadExaminationsWidgetAggregates: async (
      queries: WidgetQuery[],
    ): Promise<Record<string, WidgetAggregateResult>> => {
      const tenant = getRequestTenant();
      if (!tenant) return {};
      return repo.aggregateExaminationsWidgetQueries(tenant, queries);
    },

    loadExaminationsReportAggregates: async (
      comparisonQuery: ExaminationsReportComparisonQuery | undefined,
    ): Promise<ExaminationsReportAggregates> => {
      const tenant = getRequestTenant();
      if (!tenant) return EMPTY_EXAMINATIONS_REPORT_AGGREGATES;
      return repo.loadExaminationsReportAggregates(tenant, comparisonQuery);
    },
  };
}

export const examinationsUseCases = createExaminationsUseCases();
