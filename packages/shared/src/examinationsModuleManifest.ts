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
  customData: z.record(z.string(), z.unknown()).default({}),
  deletedAt: z.string().optional(),
  deletedBy: z.string().optional(),
  deletionReason: z.string().optional(),
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

/** Examinations module manifest — aligns with globle1 universal module architecture. */
export const EXAMINATIONS_MODULE_MANIFEST = {
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
  setupSubTabs: ['fields', 'preferences'] as const,
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    exportsIncludeDeleted: false,
    captureDeletionReason: false,
  },
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
    bulkActions: ['delete'] as const,
  },
  defaultPageSize: 12,
} as const;

export type ExaminationsModuleTier = (typeof EXAMINATIONS_MODULE_MANIFEST.tiers)[number];
