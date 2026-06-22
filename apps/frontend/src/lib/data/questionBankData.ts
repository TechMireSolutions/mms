/** @deprecated Import from `@mms/shared` — shim for legacy imports. */
export {
  type QuestionBankQuestion as Question,
  type QuestionBankTest as Test,
  type QuestionBankResult as AssessmentResult,
  type QuestionCategory as Category,
  type QuestionDifficulty,
  type QuestionType,
  QUESTION_DIFFICULTY_IDS,
  QUESTION_DIFFICULTY_BADGE_CLASSES,
  QUESTION_TYPE_IDS,
  QUESTION_TYPE_ICONS,
} from '@mms/shared';

import {
  QUESTION_DIFFICULTY_BADGE_CLASSES,
  QUESTION_TYPE_ICONS,
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
  type QuestionCategory
} from '@mms/shared';

export const QUESTIONS: QuestionBankQuestion[] = [];
export const TESTS: QuestionBankTest[] = [];
export const RESULTS: QuestionBankResult[] = [];
export const CATEGORIES: QuestionCategory[] = [];

/** @deprecated Use `QUESTION_DIFFICULTY_BADGE_CLASSES` from `@mms/shared`. */
export const DIFFICULTY_STYLES: Record<string, { cls: string }> = Object.fromEntries(
  Object.entries(QUESTION_DIFFICULTY_BADGE_CLASSES).map(([id, cls]) => [id, { cls }]),
);

/** @deprecated Use `QUESTION_DIFFICULTY_BADGE_CLASSES` + i18n. */
export const DIFFICULTY: Record<string, { label: string; cls: string }> = {
  easy: { label: 'Easy', cls: QUESTION_DIFFICULTY_BADGE_CLASSES.easy },
  medium: { label: 'Medium', cls: QUESTION_DIFFICULTY_BADGE_CLASSES.medium },
  hard: { label: 'Hard', cls: QUESTION_DIFFICULTY_BADGE_CLASSES.hard },
};

/** @deprecated Use `QUESTION_TYPE_ICONS` + i18n. */
export const QUESTION_TYPES: Record<string, { label: string; icon: string }> = {
  mcq: { label: 'MCQ', icon: QUESTION_TYPE_ICONS.mcq },
  true_false: { label: 'True / False', icon: QUESTION_TYPE_ICONS.true_false },
  short: { label: 'Short Answer', icon: QUESTION_TYPE_ICONS.short },
  fill_blank: { label: 'Fill in the blank', icon: QUESTION_TYPE_ICONS.fill_blank },
  matching: { label: 'Matching', icon: QUESTION_TYPE_ICONS.matching },
  numeric: { label: 'Numeric', icon: QUESTION_TYPE_ICONS.numeric },
  ordering: { label: 'Ordering', icon: QUESTION_TYPE_ICONS.ordering },
};
