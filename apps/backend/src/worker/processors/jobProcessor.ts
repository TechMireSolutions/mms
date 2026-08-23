import type { Job } from 'bullmq';
import type { EnqueuedJobData } from '../queues/index.js';
import { executeJob } from '../../services/backgroundJobWorkerService.js';
import { getRedisClient } from '../../lib/redis.js';
import { tracer } from '../../config/telemetry.js';

export interface JobEventPayload {
  event: 'job-progress' | 'job-completed' | 'job-failed';
  tenantId: string;
  userId: string;
  jobId: string;
  moduleId: string;
  kind: string;
  label?: string;
  progress?: { current: number; total: number; percent: number };
  hasDownload?: boolean;
  error?: string;
  completedAt?: string;
}

export async function publishJobEvent(eventPayload: JobEventPayload): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const raw = JSON.stringify(eventPayload);
    await client.publish('mms:job-event', raw);
  } catch (err) {
    console.warn('[Worker PubSub] Failed to publish job event to Redis:', err);
  }
}

export async function processBackgroundJob(job: Job<EnqueuedJobData>): Promise<void> {
  const { tenantId, userId, jobId, moduleId, kind, payload, label } = job.data;

  console.log(`[Worker Processor] Processing job ${jobId} (${moduleId}:${kind}) on queue "${job.queueName}" (Attempt ${job.attemptsMade + 1})`);

  await tracer.withSpan(
    `bullmq.job ${moduleId}:${kind}`,
    {
      'messaging.system': 'bullmq',
      'messaging.destination': job.queueName,
      'job.id': jobId,
      'tenant.id': tenantId,
      'user.id': userId,
      'job.module_id': moduleId,
      'job.kind': kind,
      'job.attempt': job.attemptsMade + 1,
    },
    async () => {
      await executeJob(tenantId, userId, jobId, moduleId, kind, payload);
    },
  );

  // Notify completion over Redis PubSub
  await publishJobEvent({
    event: 'job-completed',
    tenantId,
    userId,
    jobId,
    moduleId,
    kind,
    label,
    completedAt: new Date().toISOString(),
  });
}

