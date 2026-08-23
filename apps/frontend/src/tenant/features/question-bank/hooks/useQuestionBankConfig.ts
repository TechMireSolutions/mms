import { useCallback, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useComposedQuestionBankSettings } from './useQuestionBankSetupConfig';
import { STANDARD_MODULES_CONFIG_REGISTRY } from '@/hooks/standardModuleConfigRegistry';
import {
  getSortedFields,
  getFlatFieldsConfig,
  mergeQuestionCategories,
  type ModuleFieldDef,
  type ModuleCustomField,
  type QuestionBankSettings,
  type QuestionCategory,
  type QuestionCategoryRef,
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
  updateSettings: (settingsDraft: QuestionBankSettings) => void;
  updateSettingsAsync: (settingsDraft: QuestionBankSettings) => Promise<void>;
}

export function useQuestionBankConfig(
  questions?: readonly QuestionCategoryRef[],
): QuestionBankConfig {
  const { t } = useTranslation();
  const { fieldLabel, typeLabel, difficultyLabel, questionLanguageLabel } = useQuestionBankLabels(t);

  const registry = STANDARD_MODULES_CONFIG_REGISTRY['question-bank'];
  const { data: settings, updateAsync } = useComposedQuestionBankSettings();
  
  const defaultSettings = registry.defaultSettings as QuestionBankSettings;
  const defaultFieldDefs = registry.defaultFieldDefs as unknown as ModuleFieldDef[];

  const updateSettingsAsync = useCallback(
    async (settingsDraft: QuestionBankSettings) => {
      await updateAsync(settingsDraft);
    },
    [updateAsync],
  );

  const updateSettings = useCallback(
    (settingsDraft: QuestionBankSettings) => {
      // Fire-and-forget for local updates
      updateSettingsAsync(settingsDraft).catch(console.error);
    },
    [updateSettingsAsync],
  );

  const fields = useMemo(() => getFlatFieldsConfig(settings.fields), [settings.fields]);
  const customFields = useMemo(
    () => (settings.customFields || []) as ModuleCustomField[],
    [settings.customFields],
  );
  const fieldOrder = useMemo(
    () => settings.fieldOrder ?? defaultSettings.fieldOrder ?? [],
    [settings.fieldOrder, defaultSettings.fieldOrder],
  );

  const orderedFields = useMemo(
    () => getSortedFields(defaultFieldDefs, fieldOrder, fields, customFields),
    [defaultFieldDefs, fieldOrder, fields, customFields],
  );

  const isFieldEnabled = useCallback(
    (fieldId: string): boolean => fields[fieldId]?.enabled !== false,
    [fields],
  );

  const enabledDifficulties = useMemo(
    () =>
      (settings.difficultyLevels ?? [])
        .filter((entry: any) => entry.enabled)
        .map((entry: any) => entry.id),
    [settings.difficultyLevels],
  );

  const enabledQuestionTypes = useMemo(
    () =>
      (settings.questionTypes ?? [])
        .filter((entry: any) => entry.enabled)
        .map((entry: any) => entry.id),
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
    defaultTestDuration: settings.defaultTestDuration ?? 30,
    aiGrading: settings.aiGrading ?? false,
    isFieldEnabled,
    fieldLabel,
    typeLabel,
    difficultyLabel,
    questionLanguageLabel,
    updateSettings,
    updateSettingsAsync,
  };
}
