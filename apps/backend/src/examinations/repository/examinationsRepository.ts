import type {
  Exam,
  ExamResult,
  ExaminationsListQuery,
  ExaminationsListPageResult,
  ExaminationsCommandMetricsSnapshot,
  ExaminationsReportAggregates,
  ExaminationsReportComparisonQuery,
  WidgetQuery,
  WidgetAggregateResult,
} from '@mms/shared';

/**
 * Sole storage gateway for the examinations module (exams + results).
 *
 * Mirrors the `contacts`/`sessions`/`enrollments`/`finance`/`attendance`/`hasanat`/
 * `questionBank` reference pattern: routes and use-cases depend on this interface
 * (never on Drizzle directly), and the Drizzle-backed adapter is the only
 * implementation. Tests can inject a fake repository at the seam.
 */
export interface ExaminationsRepository {
  // Exams
  listExamsByWorkspace(tenant: string): Promise<Exam[]>;
  findExamById(tenant: string, id: string): Promise<Exam | null>;
  saveExam(tenant: string, record: Exam): Promise<void>;
  bulkSaveExams(tenant: string, records: Exam[]): Promise<void>;
  replaceExamsForWorkspace(tenant: string, records: Exam[]): Promise<void>;
  listExamsPage(tenant: string, query: ExaminationsListQuery): Promise<ExaminationsListPageResult>;

  // Results
  listExamResultsByWorkspace(tenant: string): Promise<ExamResult[]>;
  bulkSaveExamResults(tenant: string, records: ExamResult[]): Promise<void>;
  replaceExamResultsForWorkspace(tenant: string, records: ExamResult[]): Promise<void>;

  // Aggregates
  aggregateExaminationsCommandMetrics(tenant: string): Promise<ExaminationsCommandMetricsSnapshot>;
  aggregateExaminationsWidgetQueries(
    tenant: string,
    queries: WidgetQuery[],
  ): Promise<Record<string, WidgetAggregateResult>>;
  loadExaminationsReportAggregates(
    tenant: string,
    comparisonQuery?: ExaminationsReportComparisonQuery,
  ): Promise<ExaminationsReportAggregates>;
}
