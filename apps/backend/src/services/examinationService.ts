import {
  type Exam,
  type ExamResult,
  examListSchema,
  examRecordSchema,
  examResultListSchema,
  examResultRecordSchema,
} from '@mms/shared';
import { defineCollectionCrudService } from './collectionCrudService.js';
import { persistCollection } from './dbSyncService.js';

const EXAMS_COLLECTION = 'exams';
const EXAM_RESULTS_COLLECTION = 'exam_results';

// --- Exams ---
const normalizeExam = (record: Exam) => examRecordSchema.parse(record);
const examCrud = defineCollectionCrudService(EXAMS_COLLECTION, examListSchema, normalizeExam);
export const loadExams = examCrud.load;
export async function replaceExams(records: Exam[]): Promise<Exam[]> {
  const parsed = examListSchema.parse(records);
  await persistCollection(EXAMS_COLLECTION, parsed);
  return parsed;
}

// --- Exam Results ---
const normalizeExamResult = (record: ExamResult) => examResultRecordSchema.parse(record);
const examResultCrud = defineCollectionCrudService(EXAM_RESULTS_COLLECTION, examResultListSchema, normalizeExamResult);
export const loadExamResults = examResultCrud.load;
export async function replaceExamResults(records: ExamResult[]): Promise<ExamResult[]> {
  const parsed = examResultListSchema.parse(records);
  await persistCollection(EXAM_RESULTS_COLLECTION, parsed);
  return parsed;
}
