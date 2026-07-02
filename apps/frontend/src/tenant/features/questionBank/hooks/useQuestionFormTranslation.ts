import { useCallback, useMemo } from 'react';
import {
  QUESTION_BANK_FIELD_LABEL_KEYS,
  resolveQuestionFormLanguage,
  translateAppParams,
  type AppTranslationKey,
} from '@mms/shared';

export function useQuestionFormTranslation(
  systemLanguage: string,
  questionLanguage: string | undefined,
  questionLanguageFieldEnabled: boolean,
): {
  formLanguage: string;
  tForm: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
  fieldLabel: (fieldId: string, fallback?: string) => string;
  typeLabel: (typeId: string) => string;
  difficultyLabel: (difficultyId: string) => string;
  questionLanguageLabel: (languageCode: string) => string;
} {
  const formLanguage = useMemo(
    () =>
      resolveQuestionFormLanguage(
        systemLanguage,
        questionLanguage,
        questionLanguageFieldEnabled,
      ),
    [systemLanguage, questionLanguage, questionLanguageFieldEnabled],
  );

  const tForm = useCallback(
    (key: AppTranslationKey, params?: Record<string, string | number>) =>
      translateAppParams(key, formLanguage, params),
    [formLanguage],
  );

  const fieldLabel = useCallback(
    (fieldId: string, fallback?: string): string => {
      const key = QUESTION_BANK_FIELD_LABEL_KEYS[fieldId];
      return key ? tForm(key) : (fallback ?? fieldId);
    },
    [tForm],
  );

  const typeLabel = useCallback(
    (typeId: string): string => tForm(`questionBank.type.${typeId}` as AppTranslationKey),
    [tForm],
  );

  const difficultyLabel = useCallback(
    (difficultyId: string): string =>
      tForm(`questionBank.difficulty.${difficultyId}` as AppTranslationKey),
    [tForm],
  );

  const questionLanguageLabel = useCallback(
    (languageCode: string): string =>
      tForm(`questionBank.language.${languageCode}` as AppTranslationKey),
    [tForm],
  );

  return {
    formLanguage,
    tForm,
    fieldLabel,
    typeLabel,
    difficultyLabel,
    questionLanguageLabel,
  };
}
