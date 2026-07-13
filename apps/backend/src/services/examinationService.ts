import {
  type Exam,
  type ExamResult,
  examListSchema,
  examResultListSchema,
} from '@mms/shared';
import {
  listExamsByWorkspace,
  replaceExamsForWorkspace,
  listExamResultsByWorkspace,
  replaceExamResultsForWorkspace,
} from '../db/repositories/examinationRepository.js';
import { defineTenantBulkCollectionService } from './tenantBulkService.js';

const examService = defineTenantBulkCollectionService<Exam>(
  { listByWorkspace: listExamsByWorkspace, replaceForWorkspace: replaceExamsForWorkspace },
  examListSchema,
  'exams',
);
export const loadExams = examService.load;
export const replaceExams = examService.replace;

const examResultService = defineTenantBulkCollectionService<ExamResult>(
  { listByWorkspace: listExamResultsByWorkspace, replaceForWorkspace: replaceExamResultsForWorkspace },
  examResultListSchema,
  'exam_results',
);
export const loadExamResults = examResultService.load;
export const replaceExamResults = examResultService.replace;
