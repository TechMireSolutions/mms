/**
 * @file examinationsModuleManifest.ts
 * @description Examinations module manifest, DTO validation schemas, and types.
 */
import type { Permission } from './permissions.js';
import { z } from 'zod';

/** Zod schema for single Exam record. */
export const examRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  totalMarks: z.number().default(100),
  passingMarks: z.number().default(50),
  date: z.string(),
  duration: z.number().default(60),
  classIds: z.array(z.string()).default([]),
  status: z.enum(["completed", "scheduled", "cancelled", "upcoming", "ongoing"]).default("upcoming"),
  description: z.string().default(""),
  deletedAt: z.string().optional(),
  deletedBy: z.string().optional(),
  deletionReason: z.string().optional(),
}).strict();

export type Exam = z.infer<typeof examRecordSchema>;
export const examListSchema = z.array(examRecordSchema);

/** Zod schema for single Exam Result entry. */
export const examResultRecordSchema = z.object({
  id: z.string(),
  examId: z.string(),
  studentId: z.string(),
  marksObtained: z.number(),
}).strict();

export type ExamResult = z.infer<typeof examResultRecordSchema>;
export const examResultListSchema = z.array(examResultRecordSchema);

/** Examinations module manifest — aligns with MMS universal module architecture. */
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
  setupSubTabs: ['preferences'] as const,
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

export type ExaminationsModuleManifest = typeof EXAMINATIONS_MODULE_MANIFEST;
export type ExaminationsModuleTier = (typeof EXAMINATIONS_MODULE_MANIFEST.tiers)[number];

