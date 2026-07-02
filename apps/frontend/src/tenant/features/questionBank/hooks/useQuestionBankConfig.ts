import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { getObject, saveObject } from '@/lib/db';
import {
  DEFAULT_QUESTION_BANK_FIELD_DEFS,
  DEFAULT_QUESTION_BANK_SETTINGS,
  QUESTION_BANK_FIELD_LABEL_KEYS,
  getSortedFields,
  mergeQuestionCategories,
  normalizeQuestionBankSettings,
  getFlatFieldsConfig,
  type AppTranslationKey,
  type ModuleFieldDef,
  type QuestionBankSettings,
  type QuestionCategory,
  type QuestionSourceBook,
  type QuestionDifficulty,
  type QuestionType,
} from '@mms/shared';

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
  const [settings, setSettings] = useState<QuestionBankSettings>(() =>
    normalizeQuestionBankSettings(
      getObject<QuestionBankSettings>('question_bank_settings', DEFAULT_QUESTION_BANK_SETTINGS),
    ),
  );

  const refresh = useCallback(() => {
    setSettings(
      normalizeQuestionBankSettings(
        getObject<QuestionBankSettings>('question_bank_settings', DEFAULT_QUESTION_BANK_SETTINGS),
      ),
    );
  }, []);

  useEffect(() => {
    window.addEventListener('local-database-update', refresh);
    return () => window.removeEventListener('local-database-update', refresh);
  }, [refresh]);

  const updateSettings = useCallback((settingsDraft: QuestionBankSettings) => {
    const merged = normalizeQuestionBankSettings(settingsDraft);
    saveObject('question_bank_settings', merged);
    setSettings(merged);
  }, []);

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = settings.customFields ?? [];
  const fieldOrder = settings.fieldOrder ?? DEFAULT_QUESTION_BANK_SETTINGS.fieldOrder ?? [];

  const orderedFields = useMemo(
    () => getSortedFields(DEFAULT_QUESTION_BANK_FIELD_DEFS, fieldOrder, fields, customFields),
    [fieldOrder, fields, customFields],
  );

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

  const isFieldEnabled = useCallback(
    (fieldId: string): boolean => fields[fieldId]?.enabled !== false,
    [fields],
  );

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
