import { and, eq, ne, desc } from 'drizzle-orm';
import {
  BACKGROUND_JOBS_MAX_PER_USER,
  type BackgroundJobRecord,
  type BackgroundJobStatus,
} from '@mms/shared';
import { getDb } from '../db/dbClient.js';
import { backgroundJobs } from '../db/schema.js';
import { getRequestTenant } from '../lib/tenantContext.js';

export function rowToJobRecord(row: typeof backgroundJobs.$inferSelect): BackgroundJobRecord {
  return {
    id: row.id,
    moduleId: row.moduleId,
    kind: row.kind,
    status: row.status as BackgroundJobStatus,
    label: row.label,
    progress: (row.progressCurrent !== null && row.progressTotal !== null)
      ? { current: row.progressCurrent, total: row.progressTotal }
      : undefined,
    error: row.error ?? undefined,
    hasDownload: row.hasDownload,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : undefined,
  };
}

export async function listUserBackgroundJobs(userId: string): Promise<BackgroundJobRecord[]> {
  const db = getDb();
  const tenantId = getRequestTenant();
  if (!tenantId) return [];

  const rows = await db.select()
    .from(backgroundJobs)
    .where(and(
      eq(backgroundJobs.tenantId, tenantId),
      eq(backgroundJobs.userId, userId)
    ))
    .orderBy(desc(backgroundJobs.createdAt))
    .limit(BACKGROUND_JOBS_MAX_PER_USER);

  return rows.map(rowToJobRecord);
}

export async function upsertUserBackgroundJob(
  userId: string,
  job: BackgroundJobRecord,
): Promise<BackgroundJobRecord> {
  const db = getDb();
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
    payload: '{}',
    progressCurrent: job.progress?.current ?? null,
    progressTotal: job.progress?.total ?? null,
    artifactId: null,
    hasDownload: job.hasDownload ?? false,
    error: job.error ?? null,
    completedAt: job.completedAt ? new Date(job.completedAt) : null,
    updatedAt: new Date(),
  };

  const updated = await db.update(backgroundJobs)
    .set({
        status: job.status,
        label: job.label,
        progressCurrent: job.progress?.current ?? null,
        progressTotal: job.progress?.total ?? null,
        hasDownload: job.hasDownload ?? false,
        error: job.error ?? null,
        completedAt: job.completedAt ? new Date(job.completedAt) : null,
        updatedAt: new Date(),
      })
    .where(and(
      eq(backgroundJobs.tenantId, tenantId),
      eq(backgroundJobs.userId, userId),
      eq(backgroundJobs.id, job.id),
    ))
    .returning({ id: backgroundJobs.id });

  if (updated.length === 0) {
    await db.insert(backgroundJobs).values(values);
  }

  return job;
}

export async function createDatabaseBackgroundJob(
  tenantId: string,
  userId: string,
  job: BackgroundJobRecord,
  payload: unknown,
): Promise<void> {
  const db = getDb();
  await db.insert(backgroundJobs).values({
    id: job.id,
    tenantId,
    userId,
    moduleId: job.moduleId,
    kind: job.kind,
    status: job.status,
    label: job.label,
    payload: JSON.stringify(payload),
    progressCurrent: job.progress?.current ?? null,
    progressTotal: job.progress?.total ?? null,
    hasDownload: job.hasDownload ?? false,
    error: job.error ?? null,
    completedAt: job.completedAt ? new Date(job.completedAt) : null,
  });
}

export async function dismissUserBackgroundJob(userId: string, jobId: string): Promise<boolean> {
  const db = getDb();
  const tenantId = getRequestTenant();
  if (!tenantId) throw new Error('Tenant context is required to dismiss background job');

  const deleted = await db.delete(backgroundJobs)
    .where(and(
      eq(backgroundJobs.tenantId, tenantId),
      eq(backgroundJobs.userId, userId),
      eq(backgroundJobs.id, jobId)
    ))
    .returning({ id: backgroundJobs.id });

  return deleted.length > 0;
}

export async function clearFinishedUserBackgroundJobs(userId: string): Promise<number> {
  const db = getDb();
  const tenantId = getRequestTenant();
  if (!tenantId) throw new Error('Tenant context is required to clear background jobs');

  const cleared = await db.delete(backgroundJobs)
    .where(and(
      eq(backgroundJobs.tenantId, tenantId),
      eq(backgroundJobs.userId, userId),
      ne(backgroundJobs.status, 'running')
    ))
    .returning({ id: backgroundJobs.id });

  return cleared.length;
}
