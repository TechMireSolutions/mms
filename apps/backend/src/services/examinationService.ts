import {
  type Exam,
  type ExamResult,
  examListSchema,
  examResultListSchema,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listExamsByWorkspace,
  replaceExamsForWorkspace,
  listExamResultsByWorkspace,
  replaceExamResultsForWorkspace,
} from '../db/repositories/examinationRepository.js';

// --- Helper WebSocket broadcaster ---
async function broadcast(logicalKey: string) {
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', logicalKey);
  }
}

// --- Exams ---
export async function loadExams(): Promise<Exam[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listExamsByWorkspace(tenant);
}

export async function replaceExams(records: Exam[]): Promise<Exam[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = examListSchema.parse(records);
  await replaceExamsForWorkspace(tenant, parsed);
  await broadcast('exams');
  return parsed;
}

// --- Exam Results ---
export async function loadExamResults(): Promise<ExamResult[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listExamResultsByWorkspace(tenant);
}

export async function replaceExamResults(records: ExamResult[]): Promise<ExamResult[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = examResultListSchema.parse(records);
  await replaceExamResultsForWorkspace(tenant, parsed);
  await broadcast('exam_results');
  return parsed;
}
