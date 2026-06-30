import {
  countFillBlankMarkers,
  getQuestionBookCitations,
  getQuestionCategoryIds,
  isQuestionSourceFieldId,
  splitQuestionCompoundAnswer,
  type ModuleFieldDef,
  type QuestionBankQuestion as Question,
  type QuestionType,
} from '@mms/shared';
import { hasFieldValue } from '@/lib/formCompleteness';

const COMPOUND_ANSWER_TYPES = new Set<QuestionType>([
  'mcq',
  'fill_blank',
  'matching',
  'numeric',
  'ordering',
  'true_false',
]);

function fieldRendersOnForm(field: ModuleFieldDef, questionType: QuestionType): boolean {
  if (
    field.id === 'categoryId' ||
    field.id === 'difficulty' ||
    field.id === 'questionLanguage' ||
    isQuestionSourceFieldId(field.id)
  ) {
    return false;
  }
  if (field.id === 'options') return questionType === 'mcq';
  if (
    field.id === 'answer' &&
    ['mcq', 'fill_blank', 'matching', 'numeric', 'ordering'].includes(questionType)
  ) {
    return false;
  }
  return true;
}

function isAnswerComplete(questionDraft: Partial<Question> & Record<string, unknown>, questionType: QuestionType): boolean {
  if (!COMPOUND_ANSWER_TYPES.has(questionType)) return true;

  if (questionType === 'true_false') {
    return hasFieldValue(questionDraft.answer);
  }

  if (questionType === 'mcq') {
    const options = Array.isArray(questionDraft.options) ? questionDraft.options : [];
    return options.some((o) => String(o).trim()) && hasFieldValue(questionDraft.answer);
  }

  if (questionType === 'fill_blank') {
    const blankCount = countFillBlankMarkers(String(questionDraft.text ?? ''));
    const blanks = splitQuestionCompoundAnswer(String(questionDraft.answer ?? ''));
    return blankCount >= 1 && blanks.length >= blankCount && blanks.every((b) => b.trim());
  }

  if (questionType === 'matching') {
    const lefts = (Array.isArray(questionDraft.options) ? questionDraft.options : []).map((v) => String(v).trim()).filter(Boolean);
    const rights = splitQuestionCompoundAnswer(String(questionDraft.answer ?? '')).filter(Boolean);
    return lefts.length >= 2 && rights.length >= 2 && lefts.length === rights.length;
  }

  if (questionType === 'ordering') {
    const items = (Array.isArray(questionDraft.options) ? questionDraft.options : []).map((v) => String(v).trim()).filter(Boolean);
    return items.length >= 2;
  }

  if (questionType === 'numeric') {
    return questionDraft.answer !== '' && !Number.isNaN(Number(questionDraft.answer));
  }

  return hasFieldValue(questionDraft.answer);
}

/**
 * Config-driven question form completeness (0–100).
 */
export function calculateQuestionFormCompleteness(
  questionDraft: Partial<Question> & Record<string, unknown>,
  orderedFields: readonly ModuleFieldDef[],
  isFieldEnabled: (fieldId: string) => boolean,
): number {
  const questionType = (questionDraft.type as QuestionType) ?? 'mcq';
  let total = 0;
  let filled = 0;

  const bump = (enabled: boolean, isFilled: boolean): void => {
    if (!enabled) return;
    total += 1;
    if (isFilled) filled += 1;
  };

  bump(isFieldEnabled('categoryId'), getQuestionCategoryIds(questionDraft as Question).length > 0);
  bump(isFieldEnabled('difficulty'), hasFieldValue(questionDraft.difficulty));
  bump(isFieldEnabled('questionLanguage'), hasFieldValue(questionDraft.questionLanguage));
  bump(isFieldEnabled('type'), hasFieldValue(questionDraft.type));
  bump(isFieldEnabled('text'), hasFieldValue(questionDraft.text));

  for (const field of orderedFields) {
    if (!isFieldEnabled(field.id)) continue;
    if (!fieldRendersOnForm(field, questionType)) continue;
    if (field.type === 'boolean' || field.type === 'ai_summary') continue;
    bump(true, hasFieldValue(questionDraft[field.id]));
  }

  const hasSourceFields = orderedFields.some((f) => isFieldEnabled(f.id) && isQuestionSourceFieldId(f.id));
  bump(hasSourceFields, getQuestionBookCitations(questionDraft as Question).length > 0);

  const needsAnswerUnit =
    COMPOUND_ANSWER_TYPES.has(questionType) &&
    (isFieldEnabled('answer') || isFieldEnabled('options') || questionType === 'true_false');
  bump(needsAnswerUnit, isAnswerComplete(questionDraft, questionType));

  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}
