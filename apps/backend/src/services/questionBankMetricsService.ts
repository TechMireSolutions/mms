import {
  normalizeQuestionBankModulePreferences,
  type QuestionBankCommandMetricsSnapshot,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { getQuestionBankModulePreferencesForWorkspace } from '../db/repositories/questionBankModulePreferencesRepository.js';
import { aggregateQuestionBankCommandMetrics } from '../db/repositories/questionBankRepositoryList.js';

const EMPTY_METRICS: QuestionBankCommandMetricsSnapshot = {
  total: 0,
  easy: 0,
  medium: 0,
  hard: 0,
  totalTests: 0,
  totalResults: 0,
  categories: 0,
};

export async function loadQuestionBankCommandMetrics(): Promise<QuestionBankCommandMetricsSnapshot> {
  const tenant = getRequestTenant();
  if (!tenant) return EMPTY_METRICS;

  const [metrics, prefsRaw] = await Promise.all([
    aggregateQuestionBankCommandMetrics(tenant),
    getQuestionBankModulePreferencesForWorkspace(tenant),
  ]);
  const prefs = normalizeQuestionBankModulePreferences(prefsRaw);
  return { ...metrics, categories: prefs.categories?.length ?? 0 };
}