import { translateAppParams, type AppLanguageCode } from '@mms/shared';

/** Keeps true/false answer intent when the form UI language changes. */
export function syncTrueFalseLabelsForFormLanguage<
  T extends { type?: string; answer?: string; options?: string[] },
>(questionDraft: T, prevLanguage: AppLanguageCode, nextLanguage: AppLanguageCode): T {
  if (questionDraft.type !== 'true_false') return questionDraft;

  const prevTrue = translateAppParams('questionBank.true', prevLanguage);
  const prevFalse = translateAppParams('questionBank.false', prevLanguage);
  const nextTrue = translateAppParams('questionBank.true', nextLanguage);
  const nextFalse = translateAppParams('questionBank.false', nextLanguage);

  let answer = questionDraft.answer ?? '';
  if (answer === prevTrue) answer = nextTrue;
  else if (answer === prevFalse) answer = nextFalse;

  return {
    ...questionDraft,
    answer,
    options: [nextTrue, nextFalse],
  };
}
