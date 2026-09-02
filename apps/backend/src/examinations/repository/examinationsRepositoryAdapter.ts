import type { ExaminationsRepository } from './examinationsRepository.js';
import {
  listExamsByWorkspace,
  findExamById,
  saveExam,
  bulkSaveExams,
  replaceExamsForWorkspace,
  listExamResultsByWorkspace,
  bulkSaveExamResults,
  replaceExamResultsForWorkspace,
} from '../../db/repositories/examinationRepository.js';
import {
  listExamsPage,
  aggregateExaminationsCommandMetrics,
} from '../../db/repositories/examinationRepositoryList.js';
import { loadExaminationsReportAggregatesSql } from '../../db/repositories/examinationRepositoryReport.js';
import { aggregateExaminationsWidgetQueries } from '../../db/repositories/examinationsRepositoryWidgets.js';

/**
 * Drizzle-backed adapter for {@link ExaminationsRepository}. Delegates to the
 * existing concrete repository functions (no SQL rewrite in this pass).
 */
export const examinationsRepository: ExaminationsRepository = {
  listExamsByWorkspace,
  findExamById,
  saveExam,
  bulkSaveExams,
  replaceExamsForWorkspace,
  listExamsPage,
  listExamResultsByWorkspace,
  bulkSaveExamResults,
  replaceExamResultsForWorkspace,
  aggregateExaminationsCommandMetrics,
  aggregateExaminationsWidgetQueries,
  loadExaminationsReportAggregates: loadExaminationsReportAggregatesSql,
};
