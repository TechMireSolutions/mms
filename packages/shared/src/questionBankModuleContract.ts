import { z } from 'zod';
import type { Permission } from './permissions.js';

export const questionDifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const questionTypeSchema = z.enum(['mcq', 'true_false', 'short', 'fill_blank', 'matching', 'numeric', 'ordering']);

export const questionSourceReferenceSchema = z.object({
  bookName: z.string().optional(),
  series: z.string().optional(),
  bookVolume: z.string().optional(),
  volumePart: z.string().optional(),
  edition: z.string().optional(),
  isbn: z.string().optional(),
  author: z.string().optional(),
  editor: z.string().optional(),
  translator: z.string().optional(),
  publisher: z.string().optional(),
  cityOfPublication: z.string().optional(),
  publishDate: z.string().optional(),
  yearHijri: z.string().optional(),
  language: z.string().optional(),
  chapter: z.string().optional(),
  pageNumber: z.string().optional(),
  paragraph: z.string().optional(),
  footnote: z.string().optional(),
  surah: z.string().optional(),
  ayah: z.string().optional(),
  juz: z.string().optional(),
  hizb: z.string().optional(),
  hadithCollection: z.string().optional(),
  hadithNumber: z.string().optional(),
  manuscript: z.string().optional(),
  catalogNumber: z.string().optional(),
  quote: z.string().optional(),
  notes: z.string().optional(),
});

export const questionBookCitationSchema = z.object({
  bookId: z.string(),
  citation: questionSourceReferenceSchema.partial(),
});

export const questionBankQuestionRecordSchema = z.object({
  id: z.string(),
  categoryIds: z.array(z.string()),
  categoryId: z.string().optional(),
  type: questionTypeSchema,
  difficulty: questionDifficultySchema,
  questionLanguage: z.enum(['en', 'ar', 'ur', 'fa']),
  text: z.string(),
  options: z.array(z.string()),
  answer: z.string(),
  marks: z.number().optional(),
  tags: z.array(z.string()).optional(),
  sourceCitations: z.array(questionBookCitationSchema).optional(),
  sources: z.array(questionSourceReferenceSchema).optional(),
  source: questionSourceReferenceSchema.optional(),
});

export const questionBankQuestionListSchema = z.array(questionBankQuestionRecordSchema);

export const questionBankTestRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryId: z.string().nullable(),
  questionIds: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  duration: z.number(),
  createdAt: z.string(),
});

export const questionBankTestListSchema = z.array(questionBankTestRecordSchema);

export const questionBankResultRecordSchema = z.object({
  id: z.string(),
  testId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  submittedAt: z.string(),
  answers: z.record(z.string(), z.string()),
  scores: z.record(z.string(), z.number()),
});

export const questionBankResultListSchema = z.array(questionBankResultRecordSchema);


/** Question Bank module contract — aligns with globle1 universal module architecture. */
export const QUESTION_BANK_MODULE_CONTRACT = {
  moduleId: 'questionBank',
  entityType: 'QuestionBankQuestion',
  collectionKey: 'questions',
  testsCollectionKey: 'tests',
  resultsCollectionKey: 'assessment_results',
  settingsObjectKey: 'question_bank_settings',
  columnPreferencesObjectKey: 'question_bank_user_column_preferences',
  restBasePath: '/api/question-bank',
  analyticsCategory: 'questionBank',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'students.read',
    write: 'students.write',
    delete: 'students.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'students.read',
    reports: 'students.read',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['questions', 'generate'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 15,
} as const;

export type QuestionBankModuleTier = (typeof QUESTION_BANK_MODULE_CONTRACT.tiers)[number];
