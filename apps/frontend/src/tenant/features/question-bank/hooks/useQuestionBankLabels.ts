import { useCallback } from 'react';
import { QUESTION_BANK_FIELD_LABEL_KEYS, type AppTranslationKey } from '@mms/shared';

export function useQuestionBankLabels(
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string,
) {
  const fieldLabel = useCallback(
    (fieldId: string, fallback?: string): string => {
      const key = QUESTION_BANK_FIELD_LABEL_KEYS[fieldId];
      return key ? t(key) : (fallback ?? fieldId);
    },
    [t],
  );

  const typeLabel = useCallback(
    (typeId: string): string => t(`questionBank.type.${typeId}` as AppTranslationKey),
    [t],
  );

  const difficultyLabel = useCallback(
    (difficultyId: string): string =>
      t(`questionBank.difficulty.${difficultyId}` as AppTranslationKey),
    [t],
  );

  const questionLanguageLabel = useCallback(
    (languageCode: string): string =>
      t(`questionBank.language.${languageCode}` as AppTranslationKey),
    [t],
  );

  return {
    fieldLabel,
    typeLabel,
    difficultyLabel,
    questionLanguageLabel,
  };
}
