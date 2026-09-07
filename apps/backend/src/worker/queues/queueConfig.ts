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
      enableOfflineQueue: false,
      connectTimeout: 5000,
      keepAlive: 30000,
      disconnectTimeout: 2000,
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 150 + Math.floor(Math.random() * 50), 2000);
      },
    };
  } catch {
    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      keepAlive: 30000,
      disconnectTimeout: 2000,
      retryStrategy(times: number) {
        if (times > 5) return null;
        return Math.min(times * 150 + Math.floor(Math.random() * 50), 2000);
      },
    };
  }
}

export const WORKER_HEAP_LIMIT_BYTES =
  (Number(process.env.WORKER_HEAP_LIMIT_MB) || 512) * 1024 * 1024;

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: {
    count: 100,
    age: 3600, // 1 hour
  },
  removeOnFail: {
    count: 500,
    age: 86400, // 24 hours
  },
};

