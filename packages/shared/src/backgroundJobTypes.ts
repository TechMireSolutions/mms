import { z } from 'zod';

const progressSchema = z.object({
  current: z.number().int().min(0),
  total: z.number().int().min(0),
});

export const backgroundJobUpsertSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1).max(64),
  kind: z.string().min(1).max(64),
  status: z.enum(['running', 'completed', 'failed']),
  label: z.string().min(1).max(500),
  progress: progressSchema.optional(),
  error: z.string().max(500).optional(),
  hasDownload: z.boolean().optional(),
  createdAt: z.string().min(1),
  completedAt: z.string().optional(),
});

/** Cross-module background job record (globle2 §8). */
export type BackgroundJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BackgroundJobRecord {
  id: string;
  moduleId: string;
  kind: string;
  status: BackgroundJobStatus;
  label: string;
  progress?: { current: number; total: number };
  error?: string;
  /** When true, GET /api/background-jobs/:id/download serves a server-generated file. */
  hasDownload?: boolean;
  createdAt: string;
  completedAt?: string;
}

export const BACKGROUND_JOBS_API_PATH = '/api/background-jobs' as const;
export const BACKGROUND_JOBS_MAX_PER_USER = 50;
