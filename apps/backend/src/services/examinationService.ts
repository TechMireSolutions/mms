import {
  type Exam,
  type ExamResult,
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
import { defineTenantBulkCollectionService } from './tenantBulkService.js';
import { createGenericRelationalService } from './genericRelationalService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { broadcastCollection } from './websocketService.js';

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

function scopeDeleted<T extends { deletedAt?: string | null }>(
  rows: T[],
  includeDeleted?: boolean,
): T[] {
  if (includeDeleted) return rows.filter((row) => Boolean(row.deletedAt));
  return rows.filter((row) => !row.deletedAt);
}

export async function loadExams(options?: { includeDeleted?: boolean }): Promise<Exam[]> {
  const rows = await examCrud.loadAll({ includeDeleted: true });
  return scopeDeleted(rows, options?.includeDeleted);
}

export async function loadExamResults(): Promise<ExamResult[]> {
  return examResultBulkService.load();
}

async function upsertWithBroadcast<T>(
  schema: { parse: (data: unknown) => T[] },
  records: T[],
  bulkSave: (tenant: string, list: T[]) => Promise<void>,
  collection: string,
): Promise<T[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = schema.parse(records);
  await bulkSave(tenant, parsed);
  await broadcastCollection(collection);
  return parsed;
}

export const upsertExams = (records: Exam[]) =>
  upsertWithBroadcast(examListSchema, records, bulkSaveExams, 'exams');

export const upsertExamResults = (records: ExamResult[]) =>
  upsertWithBroadcast(examResultListSchema, records, bulkSaveExamResults, 'exam_results');

export const deleteExamById = examCrud.deleteById;
export const restoreExamById = examCrud.restoreById;
export const bulkSoftDeleteExams = examCrud.bulkDeleteByIds;
export const bulkRestoreExams = examCrud.bulkRestoreByIds;
