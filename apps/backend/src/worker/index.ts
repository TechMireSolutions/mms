import { Worker } from 'bullmq';
import { initDb, closeDatabase } from '../db/database.js';
import { and, eq, lt } from 'drizzle-orm';
import { withTenant } from '../db/tenant-context.js';
import { backgroundJobs } from '../db/schema.js';
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
        console.log(`[BullMQ Worker] Cleaned up ${running.length} orphaned running jobs.`);
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
        console.log(`[BullMQ Worker] Cleaned up ${pending.length} stale pending jobs.`);
      }
    });
  } catch (error) {
    console.error('[BullMQ Worker] Failed to cleanup orphaned jobs:', error);
  }
}

let isRunning = true;
const activeWorkers: Worker<EnqueuedJobData>[] = [];

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
    console.log(`[BullMQ Worker] Job ${job.id} completed on queue "${queueName}"`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed on queue "${queueName}":`, err.message);
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      void handleDeadLetterJob(queueName, job.data, err.message).catch((deadLetterErr) => {
        console.error(`[BullMQ Worker] Dead-letter handling failed for job ${job.id}:`, deadLetterErr);
      });
    }
  });

  worker.on('error', (err) => {
    console.error(`[BullMQ Worker] Error on queue "${queueName}":`, err);
  });

  return worker;
}

export async function startWorkerDaemon(): Promise<void> {
  console.log('[BullMQ Worker] Initializing Worker Daemon...');
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
    console.log(`[BullMQ Worker] Started worker for "${queueName}" with concurrency ${QUEUE_SETTINGS[queueName]?.concurrency}`);
  }

  console.log('[BullMQ Worker] All workers started and listening.');

  const shutdown = async (signal: string) => {
    if (!isRunning) return;
    console.log(`[BullMQ Worker] Received ${signal}, shutting down...`);
    isRunning = false;

    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');

    const forceExitTimer = setTimeout(() => {
      console.error('[BullMQ Worker] Graceful shutdown timed out; forcing exit');
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref?.();

    try {
      // Close all workers
      for (const worker of activeWorkers) {
        try {
          await worker.close();
        } catch (err) {
          console.error('[BullMQ Worker] Error closing worker:', err);
        }
      }

      // Close queue clients
      await closeAllQueues();

      // Release DB pool and Redis connections so the process can exit cleanly.
      await disconnectRedis();
      await closeDatabase();

      console.log('[BullMQ Worker] Gracefully shut down.');
      if (process.env.NODE_ENV !== 'test') {
        process.exit(0);
      }
    } catch (err) {
      console.error('[BullMQ Worker] Shutdown failed:', err);
      if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
      }
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('[BullMQ Worker] Unhandled rejection:', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('[BullMQ Worker] Uncaught exception:', error);
    void shutdown('uncaughtException');
  });
}

export { activeWorkers };

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  startWorkerDaemon().catch((error) => {
    console.error('[BullMQ Worker] Fatal startup error:', error);
    process.exit(1);
  });
}
