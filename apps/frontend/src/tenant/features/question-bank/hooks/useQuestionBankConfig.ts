import { useCallback, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useStandardModuleConfig } from '@/hooks/useStandardModuleConfig';
import {
  mergeQuestionCategories,
  type ModuleFieldDef,
  type QuestionBankSettings,
  type QuestionCategory,
  type QuestionSourceBook,
  type QuestionDifficulty,
  type QuestionType,
} from '@mms/shared';
import { useQuestionBankLabels } from './useQuestionBankLabels';

export interface QuestionBankConfig {
  settings: QuestionBankSettings;
  categories: QuestionCategory[];
  sourceBooks: QuestionSourceBook[];
  orderedFields: ModuleFieldDef[];
  enabledDifficulties: QuestionDifficulty[];
  enabledQuestionTypes: QuestionType[];
  defaultTestDuration: number;
  aiGrading: boolean;
  isFieldEnabled: (fieldId: string) => boolean;
  fieldLabel: (fieldId: string, fallback?: string) => string;
  typeLabel: (typeId: string) => string;
  difficultyLabel: (difficultyId: string) => string;
  questionLanguageLabel: (languageCode: string) => string;
  refresh: () => void;
  updateSettings: (settingsDraft: QuestionBankSettings) => void;
}

export function useQuestionBankConfig(
  questions?: readonly import('@mms/shared').QuestionCategoryRef[],
): QuestionBankConfig {
  const { t } = useTranslation();
  const { fieldLabel, typeLabel, difficultyLabel, questionLanguageLabel } = useQuestionBankLabels(t);
  
  const {
    settings,
    orderedFields,
    updateSettings,
    isFieldEnabled,
  } = useStandardModuleConfig('question-bank');


  const refresh = useCallback(() => {}, []);

  const enabledDifficulties = useMemo(
    () =>
      (settings.difficultyLevels ?? [])
        .filter((entry) => entry.enabled)
        .map((entry) => entry.id),
    [settings.difficultyLevels],
  );

  const enabledQuestionTypes = useMemo(
    () =>
      (settings.questionTypes ?? [])
        .filter((entry) => entry.enabled)
        .map((entry) => entry.id),
    [settings.questionTypes],
  );

  const categories = useMemo(
    () => mergeQuestionCategories(settings.categories, questions),
    [settings.categories, questions],
  );

  const sourceBooks = useMemo(
    () => settings.sourceBooks ?? [],
    [settings.sourceBooks],
  );

  return {
    settings,
    categories,
    sourceBooks,
    orderedFields,
    enabledDifficulties,
    enabledQuestionTypes,
    defaultTestDuration: settings.defaultTestDuration,
    aiGrading: settings.aiGrading,
    isFieldEnabled,
    fieldLabel,
    typeLabel,
    difficultyLabel,
    questionLanguageLabel,
    refresh,
    updateSettings,
  };
}
