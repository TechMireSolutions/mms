/** Cross-module background job record (globle2 §8). */
export type BackgroundJobStatus = 'running' | 'completed' | 'failed';

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
