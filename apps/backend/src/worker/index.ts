import { Worker } from 'bullmq';
import { initDb } from '../db/database.js';
import { eq } from 'drizzle-orm';
import { withTenant } from '../db/tenant-context.js';
import { backgroundJobs } from '../db/schema.js';
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

export async function cleanupOrphanedJobs(): Promise<void> {
  try {
    await withTenant(null, async (tx) => {
      const updated = await tx.update(backgroundJobs)
        .set({
          status: 'failed',
          error: 'Worker process restarted while job was running',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(backgroundJobs.status, 'running'))
        .returning({ id: backgroundJobs.id });

      if (updated.length > 0) {
        console.log(`[BullMQ Worker] Cleaned up ${updated.length} orphaned running jobs.`);
      }
    });
  } catch (error) {
    console.error('[BullMQ Worker] Failed to cleanup orphaned running jobs:', error);
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

  worker.on('failed', async (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed on queue "${queueName}":`, err.message);
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      await handleDeadLetterJob(queueName, job.data, err.message);
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
    const dotenv = await import('dotenv');
    dotenv.config();
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

    console.log('[BullMQ Worker] Gracefully shut down.');
    if (process.env.NODE_ENV !== 'test') {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

export { activeWorkers };

if (process.env.NODE_ENV !== 'test' && import.meta.url === `file://${process.argv[1]}`) {
  startWorkerDaemon().catch((error) => {
    console.error('[BullMQ Worker] Fatal startup error:', error);
    process.exit(1);
  });
}
