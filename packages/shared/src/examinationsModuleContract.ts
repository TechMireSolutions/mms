import type { Permission } from './permissions.js';
import { z } from 'zod';

export const examRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  totalMarks: z.number(),
  passingMarks: z.number(),
  date: z.string(),
  duration: z.number(),
  classIds: z.array(z.string()),
  status: z.enum(["completed", "scheduled", "cancelled", "upcoming", "ongoing"]),
  description: z.string(),
});

export type Exam = z.infer<typeof examRecordSchema>;
export const examListSchema = z.array(examRecordSchema);

export const examResultRecordSchema = z.object({
  id: z.string(),
  examId: z.string(),
  studentId: z.string(),
  marksObtained: z.number(),
});

export type ExamResult = z.infer<typeof examResultRecordSchema>;
export const examResultListSchema = z.array(examResultRecordSchema);

/** Examinations module contract — aligns with globle1 universal module architecture. */
export const EXAMINATIONS_MODULE_CONTRACT = {
  moduleId: 'examinations',
  entityType: 'Exam',
  collectionKey: 'exams',
  resultsCollectionKey: 'exam_results',
  settingsObjectKey: 'examinations_settings',
  examColumnPreferencesObjectKey: 'examination_exam_user_column_preferences',
  resultsColumnPreferencesObjectKey: 'examination_results_user_column_preferences',
  restBasePath: '/api/examinations',
  analyticsCategory: 'examinations',
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
    directoryViews: ['exams', 'results'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 12,
} as const;

export type ExaminationsModuleTier = (typeof EXAMINATIONS_MODULE_CONTRACT.tiers)[number];
