import { eq } from 'drizzle-orm';
import { getDb } from './db/dbClient.js';
import { initDb } from './db/database.js';
import { backgroundJobs } from './db/schema.js';
import { fork, ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let activeJobs = 0;
let running = true;
const activeChildProcesses = new Map<string, ChildProcess>();

async function cleanupOrphanedJobs(): Promise<void> {
  const db = getDb();
  try {
    const updated = await db.update(backgroundJobs)
      .set({
        status: 'failed',
        error: 'Worker process restarted while job was running',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(backgroundJobs.status, 'running'))
      .returning({ id: backgroundJobs.id });

    if (updated.length > 0) {
      console.log(`[Worker] Cleaned up ${updated.length} orphaned running jobs.`);
    }
  } catch (error) {
    console.error('[Worker] Failed to cleanup orphaned running jobs:', error);
  }
}

async function pollQueue(): Promise<void> {
  if (!running) return;
  if (activeJobs > 0) {
    setTimeout(() => void pollQueue(), 1000);
    return;
  }

  try {
    const db = getDb();

    // Claim next pending job atomically using FOR UPDATE SKIP LOCKED
    const job = await db.transaction(async (tx) => {
      const nextJobs = await tx.select()
        .from(backgroundJobs)
        .where(eq(backgroundJobs.status, 'pending'))
        .orderBy(backgroundJobs.createdAt)
        .limit(1)
        .for('update', { skipLocked: true });

      const nextJob = nextJobs[0];
      if (!nextJob) return null;

      await tx.update(backgroundJobs)
        .set({
          status: 'running',
          updatedAt: new Date(),
        })
        .where(eq(backgroundJobs.id, nextJob.id));

      return nextJob;
    });

    if (job) {
      activeJobs++;
      console.log(`[Worker] Spawning child process for job ${job.id} (${job.moduleId}:${job.kind}) for tenant ${job.tenantId}`);

      const runnerScript = path.join(__dirname, __filename.endsWith('.ts') ? 'jobRunnerProcess.ts' : 'jobRunnerProcess.js');
      
      const child = fork(runnerScript, [job.id]);
      activeChildProcesses.set(job.id, child);

      child.on('error', (err) => {
        console.error(`[Worker] Error spawning child process for job ${job.id}:`, err);
      });

      child.on('exit', async (code, signal) => {
        activeJobs--;
        activeChildProcesses.delete(job.id);

        if (code !== 0 || signal) {
          try {
            const db = getDb();
            const currentJob = await db.select({ status: backgroundJobs.status })
              .from(backgroundJobs)
              .where(eq(backgroundJobs.id, job.id))
              .limit(1);

            if (currentJob[0]?.status === 'running') {
              const errorMessage = signal
                ? `Worker process terminated by signal: ${signal}`
                : `Worker process exited with code: ${code}`;

              await db.update(backgroundJobs)
                .set({
                  status: 'failed',
                  error: errorMessage,
                  completedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(backgroundJobs.id, job.id));
              console.log(`[Worker] Job ${job.id} marked as failed due to child process exit (${signal || code})`);
            }
          } catch (dbErr) {
            console.error(`[Worker] Failed to mark crashed job ${job.id} as failed:`, dbErr);
          }
        } else {
          console.log(`[Worker] Job ${job.id} child process exited successfully`);
        }

        setImmediate(() => void pollQueue());
      });
    } else {
      setTimeout(() => void pollQueue(), 2000);
    }
  } catch (error) {
    console.error('[Worker] Error polling background jobs queue:', error);
    setTimeout(() => void pollQueue(), 5000);
  }
}

async function startWorker(): Promise<void> {
  console.log('[Worker] Initializing...');
  if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
  }

  await initDb();
  await cleanupOrphanedJobs();

  console.log('[Worker] Loop started.');
  void pollQueue();

  const shutdown = async (signal: string) => {
    console.log(`[Worker] Received ${signal}, shutting down...`);
    running = false;

    // Terminate all active child processes
    for (const [jobId, child] of activeChildProcesses.entries()) {
      console.log(`[Worker] Terminating child process for job ${jobId}...`);
      child.kill('SIGTERM');
    }

    // Wait up to 10 seconds for active jobs to finish
    let attempts = 0;
    while (activeJobs > 0 && attempts < 10) {
      console.log(`[Worker] Waiting for ${activeJobs} active job(s) to exit...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    console.log('[Worker] Gracefully shut down.');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

export { startWorker, pollQueue, cleanupOrphanedJobs };

if (process.env.NODE_ENV !== 'test') {
  startWorker().catch((error) => {
    console.error('[Worker] Fatal startup error:', error);
    process.exit(1);
  });
}


