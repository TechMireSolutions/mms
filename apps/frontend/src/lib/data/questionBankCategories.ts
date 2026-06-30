import {
  DEFAULT_QUESTION_BANK_SETTINGS,
  normalizeQuestionBankSettings,
  type QuestionCategory,
  type QuestionBankSettings,
} from '@mms/shared';
import { getObject, saveObject } from '@/lib/db';

const SETTINGS_KEY = 'question_bank_settings';

/** Persists the full category registry to question-bank settings. */
export function saveQuestionCategories(categories: QuestionCategory[]): void {
  const current = normalizeQuestionBankSettings(
    getObject<QuestionBankSettings>(SETTINGS_KEY, DEFAULT_QUESTION_BANK_SETTINGS),
  );
  saveObject(SETTINGS_KEY, { ...current, categories });
}

/** Appends or updates one category and persists. */
export function persistQuestionCategory(category: QuestionCategory): QuestionCategory[] {
  const current = normalizeQuestionBankSettings(
    getObject<QuestionBankSettings>(SETTINGS_KEY, DEFAULT_QUESTION_BANK_SETTINGS),
  );
  const existingCategoryIndex = current.categories.findIndex((existingCategory) => existingCategory.id === category.id);
  const next =
    existingCategoryIndex >= 0
      ? current.categories.map((existingCategory, categoryIndex) => (categoryIndex === existingCategoryIndex ? category : existingCategory))
      : [...current.categories, category];
  saveObject(SETTINGS_KEY, { ...current, categories: next });
  return next;
}
