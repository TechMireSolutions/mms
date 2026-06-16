import { translateAppParams, type AppLanguageCode } from '@mms/shared';

/** Keeps true/false answer intent when the form UI language changes. */
export function syncTrueFalseLabelsForFormLanguage<
  T extends { type?: string; answer?: string; options?: string[] },
>(data: T, prevLanguage: AppLanguageCode, nextLanguage: AppLanguageCode): T {
  if (data.type !== 'true_false') return data;

  const prevTrue = translateAppParams('questionBank.true', prevLanguage);
  const prevFalse = translateAppParams('questionBank.false', prevLanguage);
  const nextTrue = translateAppParams('questionBank.true', nextLanguage);
  const nextFalse = translateAppParams('questionBank.false', nextLanguage);

  let answer = data.answer ?? '';
  if (answer === prevTrue) answer = nextTrue;
  else if (answer === prevFalse) answer = nextFalse;

  return {
    ...data,
    answer,
    options: [nextTrue, nextFalse],
  };
}
