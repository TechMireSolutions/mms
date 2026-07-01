import { eq } from 'drizzle-orm';
import { initDb } from './db/database.js';
import { getDb } from './db/dbClient.js';
import { backgroundJobs } from './db/schema.js';
import { runWithTenant } from './lib/tenantContext.js';
import { registerDefaultBackgroundJobRunners } from './services/backgroundJobRunnerService.js';
import { executeJob } from './services/backgroundJobWorkerService.js';

async function main(): Promise<void> {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error('[Job Runner Process] No Job ID provided.');
    process.exit(1);
  }

  if (process.env.NODE_ENV !== 'production') {
    const dotenv = await import('dotenv');
    dotenv.config();
  }

  // Initialize DB connection pools
  await initDb();
  
  // Register all system runners
  registerDefaultBackgroundJobRunners();

  const db = getDb();
  const jobs = await db.select()
    .from(backgroundJobs)
    .where(eq(backgroundJobs.id, jobId))
    .limit(1);

  const job = jobs[0];
  if (!job) {
    console.error(`[Job Runner Process] Job ${jobId} not found in database.`);
    process.exit(1);
  }

  let payload: unknown = {};
  try {
    payload = JSON.parse(job.payload);
  } catch (error) {
    console.error(`[Job Runner Process] Failed to parse payload for job ${job.id}:`, error);
  }

  console.log(`[Job Runner Process] Running job ${job.id} (${job.moduleId}:${job.kind}) for tenant ${job.tenantId}`);
  
  await runWithTenant(job.tenantId, async () => {
    await executeJob(job.tenantId, job.userId, job.id, job.moduleId, job.kind, payload);
  });

  // Explicit exit on successful resolution
  process.exit(0);
}

main().catch((error) => {
  console.error('[Job Runner Process] Fatal execution error:', error);
  process.exit(1);
});
