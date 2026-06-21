import {
  computeQuestionBankCommandMetrics,
  DEFAULT_QUESTION_BANK_SETTINGS,
  normalizeQuestionBankSettings,
  type QuestionBankCommandMetricsSnapshot,
} from '@mms/shared';
import { fetchCollection, fetchObject } from './dbSyncService.js';

export async function loadQuestionBankCommandMetrics(): Promise<QuestionBankCommandMetricsSnapshot> {
  const questionsRaw = (await fetchCollection('questions')) ?? [];
  const testsRaw = (await fetchCollection('tests')) ?? [];
  const resultsRaw = (await fetchCollection('assessment_results')) ?? [];
  const settingsRaw = await fetchObject('question_bank_settings');
  const questions = Array.isArray(questionsRaw) ? questionsRaw : [];
  const tests = Array.isArray(testsRaw) ? testsRaw : [];
  const results = Array.isArray(resultsRaw) ? resultsRaw : [];
  const settings = normalizeQuestionBankSettings(
    settingsRaw && typeof settingsRaw === 'object'
      ? (settingsRaw as Partial<typeof DEFAULT_QUESTION_BANK_SETTINGS>)
      : null,
  );
  const categoryCount = settings.categories?.length ?? 0;
  return computeQuestionBankCommandMetrics(
    questions as Array<{ difficulty?: string }>,
    tests,
    results,
    categoryCount,
  );
}
