import type { ConnectionOptions, JobsOptions } from 'bullmq';

export const QUEUE_PDF_RENDERING = 'pdf-rendering';
export const QUEUE_BULK_EXPORT = 'bulk-export';
export const QUEUE_MESSAGING_BROADCAST = 'messaging-broadcast';

export interface QueueConcurrencyAndPriority {
  concurrency: number;
  priority: number;
}

export const QUEUE_SETTINGS: Record<string, QueueConcurrencyAndPriority> = {
  [QUEUE_PDF_RENDERING]: {
    concurrency: 4,
    priority: 1,
  },
  [QUEUE_BULK_EXPORT]: {
    concurrency: 2,
    priority: 2,
  },
  [QUEUE_MESSAGING_BROADCAST]: {
    concurrency: 10,
    priority: 3,
  },
};

export function getBullMQConnectionOptions(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname || '127.0.0.1',
      port: url.port ? Number.parseInt(url.port, 10) : 6379,
      password: url.password || undefined,
      username: url.username || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // Do not buffer commands while Redis is down. This makes `queue.add`
      // fail fast when Redis is unreachable so a timed-out dispatch cannot
      // silently enqueue the job later (after the DB row was marked failed).
      enableOfflineQueue: false,
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
    };
  }
}

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: {
    age: 24 * 3600, // 24 hours
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 7 days
    count: 5000,
  },
};
