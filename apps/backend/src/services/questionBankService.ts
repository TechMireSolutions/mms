import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
  questionBankQuestionListSchema,
  questionBankTestListSchema,
  questionBankResultListSchema,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listQuestionsByWorkspace,
  replaceQuestionsForWorkspace,
  listTestsByWorkspace,
  replaceTestsForWorkspace,
  listResultsByWorkspace,
  replaceResultsForWorkspace,
} from '../db/repositories/questionBankRepository.js';

// --- Helper WebSocket broadcaster ---
async function broadcast(logicalKey: string) {
  const tenant = getRequestTenant();
  if (tenant) {
    const { broadcastTenantUpdate } = await import('./websocketService.js');
    broadcastTenantUpdate(tenant, 'collection', logicalKey);
  }
}

// --- Questions ---
export async function loadQuestions(): Promise<QuestionBankQuestion[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listQuestionsByWorkspace(tenant);
}

export async function replaceQuestions(records: QuestionBankQuestion[]): Promise<QuestionBankQuestion[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = questionBankQuestionListSchema.parse(records);
  await replaceQuestionsForWorkspace(tenant, parsed);
  await broadcast('questions');
  return parsed;
}

// --- Tests ---
export async function loadTests(): Promise<QuestionBankTest[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listTestsByWorkspace(tenant);
}

export async function replaceTests(records: QuestionBankTest[]): Promise<QuestionBankTest[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = questionBankTestListSchema.parse(records);
  await replaceTestsForWorkspace(tenant, parsed);
  await broadcast('tests');
  return parsed;
}

// --- Assessment Results ---
export async function loadResults(): Promise<QuestionBankResult[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listResultsByWorkspace(tenant);
}

export async function replaceResults(records: QuestionBankResult[]): Promise<QuestionBankResult[]> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const parsed = questionBankResultListSchema.parse(records);
  await replaceResultsForWorkspace(tenant, parsed);
  await broadcast('assessment_results');
  return parsed;
}
