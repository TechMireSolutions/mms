import { useCallback, useMemo } from 'react';
import {
  resolveQuestionFormLanguage,
  translateAppParams,
  type AppTranslationKey,
} from '@mms/shared';
import { useQuestionBankLabels } from './useQuestionBankLabels';

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

  const { fieldLabel, typeLabel, difficultyLabel, questionLanguageLabel } = useQuestionBankLabels(tForm);

  return {
    formLanguage,
    tForm,
    fieldLabel,
    typeLabel,
    difficultyLabel,
    questionLanguageLabel,
  };
}
