import {
  computeQuestionBankCommandMetrics,
  normalizeQuestionBankModulePreferences,
  type QuestionBankCommandMetricsSnapshot,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { getQuestionBankModulePreferencesForWorkspace } from '../db/repositories/questionBankModulePreferencesRepository.js';
import { loadQuestions, loadTests, loadResults } from './questionBankService.js';

export async function loadQuestionBankCommandMetrics(): Promise<QuestionBankCommandMetricsSnapshot> {
  const questions = await loadQuestions();
  const tests = await loadTests();
  const results = await loadResults();
  // Categories live on the typed `question_bank_module_preferences` table now;
  // the legacy `question_bank_settings` object is cleared by migration 073.
  const tenant = getRequestTenant();
  const prefsRaw = tenant ? await getQuestionBankModulePreferencesForWorkspace(tenant) : null;
  const prefs = normalizeQuestionBankModulePreferences(prefsRaw);
  const categoryCount = prefs.categories?.length ?? 0;
  return computeQuestionBankCommandMetrics(
    questions as Array<{ difficulty?: string }>,
    tests,
    results,
    categoryCount,
  );
}
