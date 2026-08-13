import { z } from 'zod';
import { DEFAULT_QUESTION_BANK_SETTINGS, type QuestionBankSettings } from './questionBankModuleSettings.js';
import { moduleFieldConfigPutBodySchema } from './moduleFieldConfigPutBodySchema.js';

/** PUT /api/question-bank/config/fields — field registry JSON without prefs keys. */
export const questionBankFieldConfigPutBodySchema = moduleFieldConfigPutBodySchema
  .extend({
    customFields: z.array(z.record(z.string(), z.unknown())).optional(),
    fieldOrder: z.array(z.string()).optional(),
  })
  .passthrough();

/** PUT /api/question-bank/config/preferences — question bank prefs only. */
export const questionBankPreferencesPutBodySchema = z
  .object({
    aiGrading: z.boolean().optional(),
    defaultTestDuration: z.number().optional(),
    categories: z.array(z.record(z.string(), z.unknown())).optional(),
    sourceBooks: z.array(z.record(z.string(), z.unknown())).optional(),
    questionTypes: z.array(z.record(z.string(), z.unknown())).optional(),
    difficultyLevels: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

/** Typed preference state extracted from legacy QuestionBankSettings. */
export interface QuestionBankModulePreferences {
  aiGrading: boolean;
  defaultTestDuration: number;
  categories: any[];
  sourceBooks: any[];
  questionTypes: any[];
  difficultyLevels: any[];
}

/** Extracts preferences slice from a raw composed settings blob. */
export function normalizeQuestionBankModulePreferences(
  raw: unknown
): QuestionBankModulePreferences {
  if (!raw || typeof raw !== 'object') {
    return {
      aiGrading: DEFAULT_QUESTION_BANK_SETTINGS.aiGrading ?? false,
      defaultTestDuration: DEFAULT_QUESTION_BANK_SETTINGS.defaultTestDuration ?? 30,
      categories: DEFAULT_QUESTION_BANK_SETTINGS.categories ?? [],
      sourceBooks: DEFAULT_QUESTION_BANK_SETTINGS.sourceBooks ?? [],
      questionTypes: DEFAULT_QUESTION_BANK_SETTINGS.questionTypes ?? [],
      difficultyLevels: DEFAULT_QUESTION_BANK_SETTINGS.difficultyLevels ?? [],
    };
  }

  const prefs = raw as Partial<QuestionBankSettings>;
  return {
    aiGrading: typeof prefs.aiGrading === 'boolean' ? prefs.aiGrading : (DEFAULT_QUESTION_BANK_SETTINGS.aiGrading ?? false),
    defaultTestDuration: typeof prefs.defaultTestDuration === 'number' ? prefs.defaultTestDuration : (DEFAULT_QUESTION_BANK_SETTINGS.defaultTestDuration ?? 30),
    categories: Array.isArray(prefs.categories) ? prefs.categories : (DEFAULT_QUESTION_BANK_SETTINGS.categories ?? []),
    sourceBooks: Array.isArray(prefs.sourceBooks) ? prefs.sourceBooks : (DEFAULT_QUESTION_BANK_SETTINGS.sourceBooks ?? []),
    questionTypes: Array.isArray(prefs.questionTypes) ? prefs.questionTypes : (DEFAULT_QUESTION_BANK_SETTINGS.questionTypes ?? []),
    difficultyLevels: Array.isArray(prefs.difficultyLevels) ? prefs.difficultyLevels : (DEFAULT_QUESTION_BANK_SETTINGS.difficultyLevels ?? []),
  };
}

/** Extracts field-config slice from a raw composed settings blob. */
export function normalizeQuestionBankFieldConfigOnly(raw: unknown): QuestionBankSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_QUESTION_BANK_SETTINGS };
  }

  const safe = raw as Partial<QuestionBankSettings>;
  return {
    aiGrading: DEFAULT_QUESTION_BANK_SETTINGS.aiGrading ?? false,
    defaultTestDuration: DEFAULT_QUESTION_BANK_SETTINGS.defaultTestDuration ?? 30,
    categories: DEFAULT_QUESTION_BANK_SETTINGS.categories ?? [],
    fields: safe.fields ?? DEFAULT_QUESTION_BANK_SETTINGS.fields ?? {},
    customFields: safe.customFields ?? DEFAULT_QUESTION_BANK_SETTINGS.customFields ?? [],
    fieldOrder: safe.fieldOrder ?? DEFAULT_QUESTION_BANK_SETTINGS.fieldOrder ?? [],
  };
}

/** Recomposes preferences and field-config into the legacy flat settings shape. */
export function composeQuestionBankSettings(
  fieldConfig: QuestionBankSettings | null,
  prefs: QuestionBankModulePreferences,
): QuestionBankSettings {
  return {
    ...(fieldConfig ?? DEFAULT_QUESTION_BANK_SETTINGS),
    aiGrading: prefs.aiGrading,
    defaultTestDuration: prefs.defaultTestDuration,
    categories: prefs.categories,
    sourceBooks: prefs.sourceBooks,
    questionTypes: prefs.questionTypes,
    difficultyLevels: prefs.difficultyLevels,
  };
}

/** Drops preference keys before saving field-config to avoid overriding prefs layer. */
export function stripQuestionBankFieldConfigForPersist(
  config: Partial<QuestionBankSettings>
): Partial<QuestionBankSettings> {
  const { aiGrading, defaultTestDuration, categories, sourceBooks, questionTypes, difficultyLevels, ...fieldConfigOnly } = config;
  return fieldConfigOnly;
}
