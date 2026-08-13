import {
  type Exam,
  type ExamResult,
  type ExaminationsListQuery,
  examListSchema,
  examResultListSchema,
  examRecordSchema,
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
import { listExamsPage } from '../db/repositories/examinationRepositoryList.js';
import {
  defineTenantBulkCollectionService,
  scopeDeleted,
  upsertWithBroadcast,
} from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';

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
