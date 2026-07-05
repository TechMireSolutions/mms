import {
  computeQuestionBankCommandMetrics,
  DEFAULT_QUESTION_BANK_SETTINGS,
  normalizeQuestionBankSettings,
  type QuestionBankCommandMetricsSnapshot,
} from '@mms/shared';
import { fetchObject } from './dbSyncService.js';
import { loadQuestions, loadTests, loadResults } from './questionBankService.js';

export async function loadQuestionBankCommandMetrics(): Promise<QuestionBankCommandMetricsSnapshot> {
  const questions = await loadQuestions();
  const tests = await loadTests();
  const results = await loadResults();
  const settingsRaw = await fetchObject('question_bank_settings');
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
