import { and, eq, ne, desc } from 'drizzle-orm';
import {
  BACKGROUND_JOBS_MAX_PER_USER,
  type BackgroundJobRecord,
  type BackgroundJobStatus,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import { withTenant } from '../db/tenant-context.js';
import { backgroundJobs } from '../db/schema.js';

export function rowToJobRecord(row: typeof backgroundJobs.$inferSelect): BackgroundJobRecord {
  const record: BackgroundJobRecord = {
    id: row.id,
    moduleId: row.moduleId,
    kind: row.kind,
    status: row.status as BackgroundJobStatus,
    label: row.label,
    hasDownload: row.hasDownload,
    createdAt: row.createdAt.toISOString(),
  };

  if (row.progressCurrent !== null && row.progressTotal !== null) {
    record.progress = { current: row.progressCurrent, total: row.progressTotal };
  }
  if (row.error) record.error = row.error;
  if (row.completedAt) record.completedAt = row.completedAt.toISOString();

  return record;
}

export async function listUserBackgroundJobs(userId: string): Promise<BackgroundJobRecord[]> {
  const tenantId = getRequestTenant();
  if (!tenantId) return [];

  return withTenant(tenantId, async (tx) => {
    const rows = await tx
      .select({
        id: backgroundJobs.id,
        tenantId: backgroundJobs.tenantId,
        userId: backgroundJobs.userId,
        moduleId: backgroundJobs.moduleId,
        kind: backgroundJobs.kind,
        status: backgroundJobs.status,
        label: backgroundJobs.label,
        payload: backgroundJobs.payload,
        progressCurrent: backgroundJobs.progressCurrent,
        progressTotal: backgroundJobs.progressTotal,
        artifactId: backgroundJobs.artifactId,
        hasDownload: backgroundJobs.hasDownload,
        error: backgroundJobs.error,
        completedAt: backgroundJobs.completedAt,
        createdAt: backgroundJobs.createdAt,
        updatedAt: backgroundJobs.updatedAt,
      })
      .from(backgroundJobs)
      .where(and(
        eq(backgroundJobs.tenantId, tenantId),
        eq(backgroundJobs.userId, userId)
      ))
      .orderBy(desc(backgroundJobs.createdAt))
      .limit(BACKGROUND_JOBS_MAX_PER_USER);

    return rows.map(rowToJobRecord);
  });
}

export async function upsertUserBackgroundJob(
  userId: string,
  job: BackgroundJobRecord,
): Promise<BackgroundJobRecord> {
  const tenantId = getRequestTenant();
  if (!tenantId) throw new Error('Tenant context is required to upsert background job');

  const values = {
    id: job.id,
    tenantId,
    userId,
    moduleId: job.moduleId,
    kind: job.kind,
    status: job.status,
    label: job.label,
    payload: {},
    progressCurrent: job.progress?.current ?? null,
    progressTotal: job.progress?.total ?? null,
    artifactId: null,
    hasDownload: job.hasDownload ?? false,
    error: job.error ?? null,
    completedAt: job.completedAt ? new Date(job.completedAt) : null,
    updatedAt: new Date(),
  };

  await withTenant(tenantId, async (tx) => {
    await tx.insert(backgroundJobs)
      .values(values)
      .onConflictDoUpdate({
        target: backgroundJobs.id,
        set: {
          status: job.status,
          label: job.label,
          progressCurrent: job.progress?.current ?? null,
          progressTotal: job.progress?.total ?? null,
          hasDownload: job.hasDownload ?? false,
          error: job.error ?? null,
          completedAt: job.completedAt ? new Date(job.completedAt) : null,
          updatedAt: new Date(),
        },
      });
  });

  return job;
}

export async function createDatabaseBackgroundJob(
  tenantId: string,
  userId: string,
  job: BackgroundJobRecord,
  payload: unknown,
): Promise<void> {
  await withTenant(tenantId, async (tx) => {
    await tx.insert(backgroundJobs).values({
      id: job.id,
      tenantId,
      userId,
      moduleId: job.moduleId,
      kind: job.kind,
      status: job.status,
      label: job.label,
      payload: payload as Record<string, unknown>,
      progressCurrent: job.progress?.current ?? null,
      progressTotal: job.progress?.total ?? null,
      hasDownload: job.hasDownload ?? false,
      error: job.error ?? null,
      completedAt: job.completedAt ? new Date(job.completedAt) : null,
    });
  });
}

export async function dismissUserBackgroundJob(userId: string, jobId: string): Promise<boolean> {
  const tenantId = getRequestTenant();
  if (!tenantId) throw new Error('Tenant context is required to dismiss background job');

  return withTenant(tenantId, async (tx) => {
    const deleted = await tx.delete(backgroundJobs)
      .where(and(
        eq(backgroundJobs.tenantId, tenantId),
        eq(backgroundJobs.userId, userId),
        eq(backgroundJobs.id, jobId)
      ))
      .returning({ id: backgroundJobs.id });

    return deleted.length > 0;
  });
}

export async function clearFinishedUserBackgroundJobs(userId: string): Promise<number> {
  const tenantId = getRequestTenant();
  if (!tenantId) throw new Error('Tenant context is required to clear background jobs');

  return withTenant(tenantId, async (tx) => {
    const cleared = await tx.delete(backgroundJobs)
      .where(and(
        eq(backgroundJobs.tenantId, tenantId),
        eq(backgroundJobs.userId, userId),
        ne(backgroundJobs.status, 'running')
      ))
      .returning({ id: backgroundJobs.id });

    return cleared.length;
  });
}

/** Wipe every queued/finished/running job for the request tenant (full restore). */
export async function clearTenantBackgroundJobs(): Promise<number> {
  const tenantId = getRequestTenant();
  if (!tenantId) return 0;

  return withTenant(tenantId, async (tx) => {
    const cleared = await tx.delete(backgroundJobs)
      .where(eq(backgroundJobs.tenantId, tenantId))
      .returning({ id: backgroundJobs.id });

    return cleared.length;
  });
}
