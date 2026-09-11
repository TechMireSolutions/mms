import { Worker } from 'bullmq';
import { initDb, closeDatabase } from '../db/database.js';
import { and, eq, lt } from 'drizzle-orm';
import { withTenant } from '../db/tenant-context.js';
import { backgroundJobs, workspaces } from '../db/schema.js';
import { activeDb } from '../db/dbConnection.js';
import { disconnectRedis } from '../lib/redis.js';
import {
  QUEUE_PDF_RENDERING,
  QUEUE_BULK_EXPORT,
  QUEUE_MESSAGING_BROADCAST,
  QUEUE_SETTINGS,
  getBullMQConnectionOptions,
  closeAllQueues,
  handleDeadLetterJob,
  type EnqueuedJobData,
} from './queues/index.js';
import { processBackgroundJob } from './processors/jobProcessor.js';
import { registerDefaultBackgroundJobRunners } from '../services/backgroundJobRunnerService.js';
import { logger } from '../lib/logger.js';
import { processOutboxCdcBatch } from './processors/outboxCdcProcessor.js';
import { defaultSearchAdapter } from './adapters/searchIndexAdapter.js';
import { purgeExpiredArchivedRecords } from './purgeArchivedRecordsJob.js';

/** A 'pending' job older than this is assumed to have never been dispatched. */
const STALE_PENDING_MS = 10 * 60 * 1000;

export async function cleanupOrphanedJobs(): Promise<void> {
  try {
    await withTenant(null, async (tx) => {
      // Jobs that were running when the worker restarted are orphaned.
      const running = await tx.update(backgroundJobs)
        .set({
          status: 'failed',
          error: 'Worker process restarted while job was running',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(backgroundJobs.status, 'running'))
        .returning({ id: backgroundJobs.id });

      if (running.length > 0) {
        logger.info({ count: running.length }, 'Cleaned up orphaned running jobs');
      }

      // Jobs stuck in 'pending' for a long time were likely inserted but never
      // dispatched (crash between DB insert and queue.add). Fail them so they
      // do not sit forever.
      const stalePendingCutoff = new Date(Date.now() - STALE_PENDING_MS);
      const pending = await tx.update(backgroundJobs)
        .set({
          status: 'failed',
          error: 'Job was never dispatched to the queue',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(backgroundJobs.status, 'pending'),
          lt(backgroundJobs.createdAt, stalePendingCutoff),
        ))
        .returning({ id: backgroundJobs.id });

      if (pending.length > 0) {
        logger.info({ count: pending.length }, 'Cleaned up stale pending jobs');
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to cleanup orphaned jobs');
  }
}

let isRunning = true;
const activeWorkers: Worker<EnqueuedJobData>[] = [];
/** NodeJS timer handle for the CDC outbox poller — cleared on shutdown. */
let cdcPollerTimer: ReturnType<typeof setInterval> | null = null;
/** NodeJS timer handle for the daily retention purge scheduler — cleared on shutdown. */
let purgeSchedulerTimer: ReturnType<typeof setTimeout> | null = null;

const CDC_POLL_INTERVAL_MS = 5_000;

/**
 * Computes millisecond delay until the next specified UTC hour (default: 02:00 UTC).
 */
export function getMsUntilNextUtcHour(targetUtcHour = 2): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(targetUtcHour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next.getTime() - now.getTime();
}

/**
 * Runs a full retention purge cycle across all active tenant workspaces.
 */
export async function runRetentionPurgeCycle(dbClient = activeDb()): Promise<Record<string, Record<string, number>>> {
  const results: Record<string, Record<string, number>> = {};
  try {
    const tenants = await dbClient
      .select({ subdomain: workspaces.subdomain })
      .from(workspaces);

    for (const { subdomain } of tenants) {
      try {
        const res = await purgeExpiredArchivedRecords(dbClient, subdomain);
        results[subdomain] = res.purgedTables;
      } catch (tenantErr) {
        logger.error({ tenant: subdomain, err: tenantErr }, '[RetentionPurge] Failed for tenant');
      }
    }
    logger.info({ results }, '[RetentionPurge] Completed scheduled daily purge cycle');
  } catch (err) {
    logger.error({ err }, '[RetentionPurge] Error running scheduled retention purge cycle');
  }
  return results;
}

/**
 * Schedules the retention purge worker to run daily at 02:00 UTC.
 */
export function scheduleNextDailyPurge(dbClient = activeDb(), targetUtcHour = 2): void {
  if (!isRunning) return;
  const delayMs = getMsUntilNextUtcHour(targetUtcHour);
  logger.info({ delayMs, targetUtcHour }, '[RetentionPurge] Scheduled next daily purge run');

  purgeSchedulerTimer = setTimeout(() => {
    void runRetentionPurgeCycle(dbClient)
      .catch((err) => {
        logger.error({ err }, '[RetentionPurge] Error during scheduled purge run');
      })
      .finally(() => {
        scheduleNextDailyPurge(dbClient, targetUtcHour);
      });
  }, delayMs);
  purgeSchedulerTimer.unref?.();
}

export function createWorkerForQueue(queueName: string): Worker<EnqueuedJobData> {
  const connection = getBullMQConnectionOptions();
  const concurrency = QUEUE_SETTINGS[queueName]?.concurrency ?? 2;

  const worker = new Worker<EnqueuedJobData>(
    queueName,
    async (job) => {
      await processBackgroundJob(job);
    },
    {
      connection,
      concurrency,
      lockDuration: 60000,
    },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: queueName }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queue: queueName, err: err.message }, 'Job failed');
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      void handleDeadLetterJob(queueName, job.data, err.message).catch((deadLetterErr) => {
        logger.error({ jobId: job.id, err: deadLetterErr }, 'Dead-letter handling failed');
      });
    }
  });

  worker.on('error', (err) => {
    logger.error({ queue: queueName, err }, 'Worker error');
  });

  return worker;
}

export async function startWorkerDaemon(): Promise<void> {
  logger.info('Initializing Worker Daemon...');
  if (process.env.NODE_ENV !== 'production') {
    try {
      process.loadEnvFile();
    } catch {
      // ignore missing .env file
    }
  }

  await initDb();
  await cleanupOrphanedJobs();

  // Register job runners
  registerDefaultBackgroundJobRunners();

  // Instantiate workers for all 3 queues
  const queueNames = [QUEUE_PDF_RENDERING, QUEUE_BULK_EXPORT, QUEUE_MESSAGING_BROADCAST];
  for (const queueName of queueNames) {
    const worker = createWorkerForQueue(queueName);
    activeWorkers.push(worker);
    logger.info({ queue: queueName, concurrency: QUEUE_SETTINGS[queueName]?.concurrency }, 'Started worker');
  }

  logger.info('All workers started and listening.');

  // Start the CDC outbox poller (5-second interval, no-op when DB has no rows)
  cdcPollerTimer = setInterval(() => {
    processOutboxCdcBatch(defaultSearchAdapter).catch((err) => {
      logger.error({ err }, '[OutboxCdc] Poll cycle error');
    });
  }, CDC_POLL_INTERVAL_MS);
  cdcPollerTimer.unref?.();
  logger.info({ intervalMs: CDC_POLL_INTERVAL_MS }, '[OutboxCdc] CDC poller started');

  // Register the daily retention purge schedule to run at 02:00 UTC
  scheduleNextDailyPurge(activeDb(), 2);

  const shutdown = async (signal: string) => {
    if (!isRunning) return;
    logger.info({ signal }, 'Received signal, shutting down...');
    isRunning = false;

    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');

    const forceExitTimer = setTimeout(() => {
      logger.fatal('Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref?.();

    try {
      // Stop CDC poller first so it doesn't fire mid-shutdown
      if (cdcPollerTimer !== null) {
        clearInterval(cdcPollerTimer);
        cdcPollerTimer = null;
      }

      // Stop retention purge scheduler
      if (purgeSchedulerTimer !== null) {
        clearTimeout(purgeSchedulerTimer);
        purgeSchedulerTimer = null;
      }

      // Close all workers
      for (const worker of activeWorkers) {
        try {
          await worker.close();
        } catch (err) {
          logger.error({ err }, 'Error closing worker');
        }
      }

      // Close queue clients
      await closeAllQueues();

      // Release DB pool and Redis connections so the process can exit cleanly.
      await disconnectRedis();
      await closeDatabase();

      logger.info('Gracefully shut down.');
      if (process.env.NODE_ENV !== 'test') {
        process.exit(0);
      }
    } catch (err) {
      logger.error({ err }, 'Shutdown failed');
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    void shutdown('uncaughtException');
  });
}

export {
  activeWorkers,
  purgeExpiredArchivedRecords,
};

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  startWorkerDaemon().catch((error) => {
    logger.fatal({ err: error }, 'Fatal startup error');
    process.exit(1);
  });
}
