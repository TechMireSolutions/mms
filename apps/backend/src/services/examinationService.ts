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
import {
  listExamsByWorkspace,
  findExamById,
  saveExam,
  bulkSaveExams,
  replaceExamsForWorkspace,
  listExamResultsByWorkspace,
  bulkSaveExamResults,
  replaceExamResultsForWorkspace,
} from '../db/repositories/examinationRepository.js';
import {
  aggregateExaminationsCommandMetrics,
  listExamsPage,
} from '../db/repositories/examinationRepositoryList.js';
import { loadExaminationsReportAggregatesSql } from '../db/repositories/examinationRepositoryReport.js';
import { aggregateExaminationsWidgetQueries } from '../db/repositories/examinationsRepositoryWidgets.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import * as tenantContext from '../lib/tenantContext.js';

const examBulkService = defineTenantBulkCollectionService<Exam>(
  { listByWorkspace: listExamsByWorkspace, replaceForWorkspace: replaceExamsForWorkspace },
  examListSchema,
  'exams',
);
export const replaceExams = examBulkService.replace;

const examResultBulkService = defineTenantBulkCollectionService<ExamResult>(
  { listByWorkspace: listExamResultsByWorkspace, replaceForWorkspace: replaceExamResultsForWorkspace },
  examResultListSchema,
  'exam_results',
);
export const replaceExamResults = examResultBulkService.replace;

const examCrud = createGenericRelationalService<Exam>({
  repo: {
    listByWorkspace: listExamsByWorkspace,
    findById: findExamById,
    save: saveExam,
  },
  schema: examRecordSchema,
  websocketCollection: 'exams',
  idPrefix: 'ex',
});

export async function loadExams(options?: { includeDeleted?: boolean }): Promise<Exam[]> {
  const rows = await examCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
}

/** SQL-paged exams Work list (server-side search/status/soft-delete). */
export async function loadExamsPage(
  query: ExaminationsListQuery & { includeDeleted?: boolean },
): Promise<{
  exams: Exam[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const tenant = tenantContext.getRequestTenant();
  if (!tenant) {
    return {
      exams: [],
      total: 0,
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      hasMore: false,
    };
  }
  return listExamsPage(tenant, query);
}

export async function loadExamResults(): Promise<ExamResult[]> {
  return examResultBulkService.load();
}

export const upsertExams = (records: Exam[]) =>
  upsertWithBroadcast(examListSchema, records, bulkSaveExams, 'exams');

export const upsertExamResults = (records: ExamResult[]) =>
  upsertWithBroadcast(examResultListSchema, records, bulkSaveExamResults, 'exam_results');

export const deleteExamById = examCrud.deleteById;
export const restoreExamById = examCrud.restoreById;
export const bulkSoftDeleteExams = examCrud.bulkDeleteByIds;
export const bulkRestoreExams = examCrud.bulkRestoreByIds;

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

export async function loadExaminationsCommandMetrics(): Promise<ExaminationsCommandMetricsSnapshot> {
  const tenant = tenantContext.getRequestTenant();
  if (!tenant) return EMPTY_EXAMINATIONS_METRICS;
  return aggregateExaminationsCommandMetrics(tenant);
}

export async function loadExaminationsWidgetAggregates(
  queries: WidgetQuery[],
): Promise<Record<string, WidgetAggregateResult>> {
  const tenant = tenantContext.getRequestTenant();
  if (!tenant) return {};
  return aggregateExaminationsWidgetQueries(tenant, queries);
}

export async function loadExaminationsReportAggregates(
  comparisonQuery: ExaminationsReportComparisonQuery | undefined,
): Promise<ExaminationsReportAggregates> {
  const tenant = tenantContext.getRequestTenant();
  if (!tenant) return EMPTY_EXAMINATIONS_REPORT_AGGREGATES;
  return loadExaminationsReportAggregatesSql(tenant, comparisonQuery);
}
