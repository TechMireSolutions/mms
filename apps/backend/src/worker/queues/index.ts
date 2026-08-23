import { Queue } from 'bullmq';
import type { BackgroundJobRecord } from '@mms/shared';
import {
  QUEUE_PDF_RENDERING,
  QUEUE_BULK_EXPORT,
  QUEUE_MESSAGING_BROADCAST,
  QUEUE_SETTINGS,
  DEFAULT_JOB_OPTIONS,
  getBullMQConnectionOptions,
} from './queueConfig.js';

export interface EnqueuedJobData {
  jobId: string;
  tenantId: string;
  userId: string;
  moduleId: string;
  kind: string;
  label?: string;
  payload: unknown;
  enqueuedAt: string;
}

const queues = new Map<string, Queue<EnqueuedJobData>>();

export function getQueue(queueName: string): Queue<EnqueuedJobData> {
  let queue = queues.get(queueName);
  if (!queue) {
    const connection = getBullMQConnectionOptions();
    queue = new Queue<EnqueuedJobData>(queueName, {
      connection,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        priority: QUEUE_SETTINGS[queueName]?.priority ?? 2,
      },
    });
    queues.set(queueName, queue);
  }
  return queue;
}

export function resolveQueueNameForJob(moduleId: string, kind: string): string {
  const normalizedKind = kind.toLowerCase();
  const normalizedModule = moduleId.toLowerCase();

  if (normalizedKind.includes('pdf') || normalizedKind.includes('receipt') || normalizedKind.includes('report-card')) {
    return QUEUE_PDF_RENDERING;
  }

  if (normalizedModule === 'messaging' || normalizedKind.includes('broadcast') || normalizedKind.includes('sms') || normalizedKind.includes('whatsapp')) {
    return QUEUE_MESSAGING_BROADCAST;
  }

  return QUEUE_BULK_EXPORT;
}

/**
 * Dispatches a background job to the appropriate BullMQ queue.
 * Returns true if enqueued to BullMQ, false if Redis is unavailable and should fallback.
 */
export async function dispatchJobToQueue(
  tenantId: string,
  userId: string,
  job: BackgroundJobRecord,
  payload: unknown,
): Promise<boolean> {
  const queueName = resolveQueueNameForJob(job.moduleId, job.kind);
  const queue = getQueue(queueName);

  const jobData: EnqueuedJobData = {
    jobId: job.id,
    tenantId,
    userId,
    moduleId: job.moduleId,
    kind: job.kind,
    label: job.label,
    payload,
    enqueuedAt: new Date().toISOString(),
  };

  try {
    await queue.add(`${job.moduleId}:${job.kind}`, jobData, {
      jobId: job.id,
      priority: QUEUE_SETTINGS[queueName]?.priority ?? 2,
    });
    return true;
  } catch (error) {
    console.warn(`[BullMQ] Failed to enqueue job ${job.id} to ${queueName}:`, error);
    return false;
  }
}

/**
 * Record a Dead-Letter Queue (DLQ) event when a job exhausts all retries.
 */
export async function handleDeadLetterJob(
  queueName: string,
  jobData: EnqueuedJobData,
  failedReason: string,
): Promise<void> {
  console.error(
    `[BullMQ DLQ] Job ${jobData.jobId} (${jobData.moduleId}:${jobData.kind}) in queue "${queueName}" permanently failed: ${failedReason}`,
  );
}

/**
 * Gracefully close all BullMQ queue instances.
 */
export async function closeAllQueues(): Promise<void> {
  for (const [name, queue] of queues.entries()) {
    try {
      await queue.close();
      console.log(`[BullMQ] Queue "${name}" closed.`);
    } catch (err) {
      console.error(`[BullMQ] Error closing queue "${name}":`, err);
    }
  }
  queues.clear();
}

export * from './queueConfig.js';
