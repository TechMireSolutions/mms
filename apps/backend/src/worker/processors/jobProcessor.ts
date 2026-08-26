import type { Job } from 'bullmq';
import type { EnqueuedJobData } from '../queues/index.js';
import { executeJob } from '../../services/backgroundJobWorkerService.js';
import { tracer } from '../../config/telemetry.js';
import { publishJobEvent } from '../pubsub/jobPubSub.js';
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

}
