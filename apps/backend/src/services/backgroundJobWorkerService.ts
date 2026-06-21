import type { BackgroundJobRecord } from '@mms/shared';
import { runWithTenant } from '../lib/tenantContext.js';
import {
  listUserBackgroundJobs,
  upsertUserBackgroundJob,
} from './backgroundJobService.js';

export interface BackgroundJobRunContext {
  tenant: string;
  userId: string;
  jobId: string;
  updateProgress: (current: number, total: number) => Promise<void>;
  complete: (patch?: Partial<BackgroundJobRecord>) => Promise<void>;
  fail: (error: string) => Promise<void>;
}

export type BackgroundJobRunner = (
  payload: unknown,
  ctx: BackgroundJobRunContext,
) => Promise<void>;

const runners = new Map<string, BackgroundJobRunner>();

export function registerBackgroundJobRunner(key: string, runner: BackgroundJobRunner): void {
  runners.set(key, runner);
}

function runnerKey(job: BackgroundJobRecord): string {
  return `${job.moduleId}:${job.kind}`;
}

async function patchJob(
  userId: string,
  jobId: string,
  patch: Partial<BackgroundJobRecord>,
): Promise<BackgroundJobRecord> {
  const jobs = await listUserBackgroundJobs(userId);
  const existing = jobs.find((j) => j.id === jobId);
  if (!existing) {
    throw new Error(`Background job not found: ${jobId}`);
  }
  const updated: BackgroundJobRecord = { ...existing, ...patch };
  return upsertUserBackgroundJob(userId, updated);
}

async function executeJob(
  tenant: string,
  userId: string,
  job: BackgroundJobRecord,
  payload: unknown,
): Promise<void> {
  const key = runnerKey(job);
  const runner = runners.get(key);
  if (!runner) {
    await patchJob(userId, job.id, {
      status: 'failed',
      error: `No runner registered for ${key}`,
      completedAt: new Date().toISOString(),
    });
    return;
  }

  const ctx: BackgroundJobRunContext = {
    tenant,
    userId,
    jobId: job.id,
    updateProgress: async (current, total) => {
      await patchJob(userId, job.id, { progress: { current, total } });
    },
    complete: async (patch) => {
      await patchJob(userId, job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        ...patch,
      });
    },
    fail: async (error) => {
      await patchJob(userId, job.id, {
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      });
    },
  };

  try {
    await runner(payload, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Background job failed';
    await ctx.fail(message);
  }
}

/** Persists a running job and executes the registered runner off-request. */
export async function enqueueBackgroundJob(
  tenant: string,
  userId: string,
  job: BackgroundJobRecord,
  payload: unknown,
): Promise<BackgroundJobRecord> {
  await runWithTenant(tenant, () => upsertUserBackgroundJob(userId, job));
  setImmediate(() => {
    void runWithTenant(tenant, () => executeJob(tenant, userId, job, payload));
  });
  return job;
}

export async function getUserBackgroundJob(
  userId: string,
  jobId: string,
): Promise<BackgroundJobRecord | null> {
  const jobs = await listUserBackgroundJobs(userId);
  return jobs.find((j) => j.id === jobId) ?? null;
}
