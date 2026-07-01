import { and, eq } from 'drizzle-orm';
import type { BackgroundJobRecord } from '@mms/shared';
import { runWithTenant, getRequestTenant } from '../lib/tenantContext.js';
import { getDb } from '../db/dbClient.js';
import { backgroundJobs } from '../db/schema.js';
import {
  rowToJobRecord,
  upsertUserBackgroundJob,
  createDatabaseBackgroundJob,
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
  runContext: BackgroundJobRunContext,
) => Promise<void>;

const runners = new Map<string, BackgroundJobRunner>();

export function registerBackgroundJobRunner(key: string, runner: BackgroundJobRunner): void {
  runners.set(key, runner);
}

async function patchJob(
  userId: string,
  jobId: string,
  patch: Partial<BackgroundJobRecord>,
): Promise<BackgroundJobRecord> {
  const db = getDb();
  const tenantId = getRequestTenant();
  if (!tenantId) throw new Error('Tenant context is required to patch background job');

  const rows = await db.select()
    .from(backgroundJobs)
    .where(and(
      eq(backgroundJobs.tenantId, tenantId),
      eq(backgroundJobs.userId, userId),
      eq(backgroundJobs.id, jobId)
    ))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new Error(`Background job not found: ${jobId}`);
  }

  const existing = rowToJobRecord(row);
  const updated: BackgroundJobRecord = { ...existing, ...patch };
  return upsertUserBackgroundJob(userId, updated);
}

export async function executeJob(
  tenant: string,
  userId: string,
  jobId: string,
  moduleId: string,
  kind: string,
  payload: unknown,
): Promise<void> {
  const key = `${moduleId}:${kind}`;
  const runner = runners.get(key);

  const runContext: BackgroundJobRunContext = {
    tenant,
    userId,
    jobId,
    updateProgress: async (current, total) => {
      await patchJob(userId, jobId, { progress: { current, total } });
    },
    complete: async (patch) => {
      await patchJob(userId, jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        ...patch,
      });
    },
    fail: async (error) => {
      await patchJob(userId, jobId, {
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      });
    },
  };

  if (!runner) {
    await runContext.fail(`No runner registered for ${key}`);
    return;
  }

  try {
    await runner(payload, runContext);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Background job failed';
    await runContext.fail(message);
  }
}

/** Persists a running job and delegates execution to the out-of-process worker queue. */
export async function enqueueBackgroundJob(
  tenant: string,
  userId: string,
  job: BackgroundJobRecord,
  payload: unknown,
): Promise<BackgroundJobRecord> {
  // Create job with 'pending' status in PostgreSQL
  await runWithTenant(tenant, () => createDatabaseBackgroundJob(tenant, userId, job, payload));
  return job;
}

export async function getUserBackgroundJob(
  userId: string,
  jobId: string,
): Promise<BackgroundJobRecord | null> {
  const db = getDb();
  const tenantId = getRequestTenant();
  if (!tenantId) return null;

  const rows = await db.select()
    .from(backgroundJobs)
    .where(and(
      eq(backgroundJobs.tenantId, tenantId),
      eq(backgroundJobs.userId, userId),
      eq(backgroundJobs.id, jobId)
    ))
    .limit(1);

  const row = rows[0];
  return row ? rowToJobRecord(row) : null;
}
