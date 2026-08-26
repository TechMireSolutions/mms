import { and, eq } from 'drizzle-orm';

export class QueueUnavailableError extends Error {
  constructor(message = 'Failed to enqueue background job. The task queue service may be unavailable.') {
    super(message);
    this.name = 'QueueUnavailableError';
  }
}
import type { BackgroundJobRecord } from '@mms/shared';
import { runWithTenant, getRequestTenant } from '../lib/tenantContext.js';
import { withTenant } from '../db/tenant-context.js';
import { backgroundJobs } from '../db/schema.js';
import {
  rowToJobRecord,
  createDatabaseBackgroundJob,
} from './backgroundJobService.js';
import { dispatchJobToQueue } from '../worker/queues/index.js';
import { publishJobEvent } from '../worker/pubsub/jobPubSub.js';

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
  tenantId: string,
  userId: string,
  jobId: string,
  patch: Partial<BackgroundJobRecord>,
): Promise<BackgroundJobRecord> {
  if (!tenantId) throw new Error('Tenant context is required to patch background job');

  const updateValues: {
    status?: string;
    label?: string;
    progressCurrent?: number | null;
    progressTotal?: number | null;
    error?: string | null;
    hasDownload?: boolean;
    completedAt?: Date | null;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (patch.status !== undefined) updateValues.status = patch.status;
  if (patch.label !== undefined) updateValues.label = patch.label;
  if (patch.progress !== undefined) {
    updateValues.progressCurrent = patch.progress.current;
    updateValues.progressTotal = patch.progress.total;
  }
  if (patch.error !== undefined) updateValues.error = patch.error;
  if (patch.hasDownload !== undefined) updateValues.hasDownload = patch.hasDownload;
  if (patch.completedAt !== undefined) {
    updateValues.completedAt = patch.completedAt ? new Date(patch.completedAt) : null;
  }

  return withTenant(tenantId, async (tx) => {
    const updatedRows = await tx.update(backgroundJobs)
      .set(updateValues)
      .where(and(
        eq(backgroundJobs.tenantId, tenantId),
        eq(backgroundJobs.userId, userId),
        eq(backgroundJobs.id, jobId),
      ))
      .returning();

    const row = updatedRows[0];
    if (!row) {
      throw new Error(`Background job not found: ${jobId}`);
    }
    return rowToJobRecord(row);
  });
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
      await patchJob(tenant, userId, jobId, { progress: { current, total } });
      const percent = total > 0 ? Math.round((current / total) * 100) : 0;
      await publishJobEvent({
        event: 'job-progress',
        tenantId: tenant,
        userId,
        jobId,
        moduleId,
        kind,
        progress: { current, total, percent },
      });
    },
    complete: async (patch) => {
      await patchJob(tenant, userId, jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        ...patch,
      });
      await publishJobEvent({
        event: 'job-completed',
        tenantId: tenant,
        userId,
        jobId,
        moduleId,
        kind,
        label: patch?.label,
        hasDownload: patch?.hasDownload,
        completedAt: new Date().toISOString(),
      });
    },
    fail: async (error) => {
      await patchJob(tenant, userId, jobId, {
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      });
      await publishJobEvent({
        event: 'job-failed',
        tenantId: tenant,
        userId,
        jobId,
        moduleId,
        kind,
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
    await runWithTenant(tenant, async () => {
      await runner(payload, runContext);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Background job failed';
    await runContext.fail(message);
  }
}

/** 
 * Forcefully fails a job in the database and broadcasts the event. 
 * Useful for Dead-Letter Queue (DLQ) handlers when a job exhausts retries.
 */
export async function markJobPermanentlyFailed(
  tenantId: string,
  userId: string,
  jobId: string,
  moduleId: string,
  kind: string,
  error: string,
): Promise<void> {
  await patchJob(tenantId, userId, jobId, {
    status: 'failed',
    error,
    completedAt: new Date().toISOString(),
  });
  
  await publishJobEvent({
    event: 'job-failed',
    tenantId,
    userId,
    jobId,
    moduleId,
    kind,
    error,
    completedAt: new Date().toISOString(),
  });
}

/** Persists a running job and delegates execution to the out-of-process worker queue. */
export async function enqueueBackgroundJob(
  tenant: string,
  userId: string,
  job: BackgroundJobRecord,
  payload: unknown,
): Promise<BackgroundJobRecord> {
  // Create job with 'pending' status in PostgreSQL
  const pendingJob: BackgroundJobRecord = {
    ...job,
    status: 'pending',
  };
  await runWithTenant(tenant, () => createDatabaseBackgroundJob(tenant, userId, pendingJob, payload));

  // Dispatch to BullMQ Queue
  const enqueued = await dispatchJobToQueue(tenant, userId, pendingJob, payload);
  
  if (!enqueued) {
    const errorMsg = 'Failed to enqueue background job. The task queue service may be unavailable.';
    await patchJob(tenant, userId, job.id, { 
      status: 'failed', 
      error: errorMsg 
    });
    throw new QueueUnavailableError(errorMsg);
  }

  return job;
}

export async function getUserBackgroundJob(
  userId: string,
  jobId: string,
  explicitTenantId?: string,
): Promise<BackgroundJobRecord | null> {
  const tenantId = explicitTenantId ?? getRequestTenant();
  if (!tenantId) return null;

  return withTenant(tenantId, async (tx) => {
    const rows = await tx.select()
      .from(backgroundJobs)
      .where(and(
        eq(backgroundJobs.tenantId, tenantId),
        eq(backgroundJobs.userId, userId),
        eq(backgroundJobs.id, jobId)
      ))
      .limit(1);

    const row = rows[0];
    return row ? rowToJobRecord(row) : null;
  });
}

/** Returns the stored enqueue payload for an existing user job (idempotency body binding). */
export async function getUserBackgroundJobPayload(
  userId: string,
  jobId: string,
  explicitTenantId?: string,
): Promise<Record<string, unknown> | null> {
  const tenantId = explicitTenantId ?? getRequestTenant();
  if (!tenantId) return null;

  return withTenant(tenantId, async (tx) => {
    const rows = await tx.select({ payload: backgroundJobs.payload })
      .from(backgroundJobs)
      .where(and(
        eq(backgroundJobs.tenantId, tenantId),
        eq(backgroundJobs.userId, userId),
        eq(backgroundJobs.id, jobId),
      ))
      .limit(1);

    return rows[0]?.payload ?? null;
  });
}
