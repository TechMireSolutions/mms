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

function isAnswerComplete(data: Partial<Question> & Record<string, unknown>, questionType: QuestionType): boolean {
  if (!COMPOUND_ANSWER_TYPES.has(questionType)) return true;

  if (questionType === 'true_false') {
    return hasFieldValue(data.answer);
  }

  if (questionType === 'mcq') {
    const options = Array.isArray(data.options) ? data.options : [];
    return options.some((o) => String(o).trim()) && hasFieldValue(data.answer);
  }

  if (questionType === 'fill_blank') {
    const blankCount = countFillBlankMarkers(String(data.text ?? ''));
    const blanks = splitQuestionCompoundAnswer(String(data.answer ?? ''));
    return blankCount >= 1 && blanks.length >= blankCount && blanks.every((b) => b.trim());
  }

  if (questionType === 'matching') {
    const lefts = (Array.isArray(data.options) ? data.options : []).map((v) => String(v).trim()).filter(Boolean);
    const rights = splitQuestionCompoundAnswer(String(data.answer ?? '')).filter(Boolean);
    return lefts.length >= 2 && rights.length >= 2 && lefts.length === rights.length;
  }

  if (questionType === 'ordering') {
    const items = (Array.isArray(data.options) ? data.options : []).map((v) => String(v).trim()).filter(Boolean);
    return items.length >= 2;
  }

  if (questionType === 'numeric') {
    return data.answer !== '' && !Number.isNaN(Number(data.answer));
  }

  return hasFieldValue(data.answer);
}

/**
 * Config-driven question form completeness (0–100).
 */
export function calculateQuestionFormCompleteness(
  data: Partial<Question> & Record<string, unknown>,
  orderedFields: readonly ModuleFieldDef[],
  isFieldEnabled: (fieldId: string) => boolean,
): number {
  const questionType = (data.type as QuestionType) ?? 'mcq';
  let total = 0;
  let filled = 0;

  const bump = (enabled: boolean, isFilled: boolean): void => {
    if (!enabled) return;
    total += 1;
    if (isFilled) filled += 1;
  };

  bump(isFieldEnabled('categoryId'), getQuestionCategoryIds(data as Question).length > 0);
  bump(isFieldEnabled('difficulty'), hasFieldValue(data.difficulty));
  bump(isFieldEnabled('questionLanguage'), hasFieldValue(data.questionLanguage));
  bump(isFieldEnabled('type'), hasFieldValue(data.type));
  bump(isFieldEnabled('text'), hasFieldValue(data.text));

  for (const field of orderedFields) {
    if (!isFieldEnabled(field.id)) continue;
    if (!fieldRendersOnForm(field, questionType)) continue;
    if (field.type === 'boolean' || field.type === 'ai_summary') continue;
    bump(true, hasFieldValue(data[field.id]));
  }

  const hasSourceFields = orderedFields.some((f) => isFieldEnabled(f.id) && isQuestionSourceFieldId(f.id));
  bump(hasSourceFields, getQuestionBookCitations(data as Question).length > 0);

  const needsAnswerUnit =
    COMPOUND_ANSWER_TYPES.has(questionType) &&
    (isFieldEnabled('answer') || isFieldEnabled('options') || questionType === 'true_false');
  bump(needsAnswerUnit, isAnswerComplete(data, questionType));

  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}
