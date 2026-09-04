import type { Job } from 'bullmq';
import type { EnqueuedJobData } from '../queues/index.js';
import { executeJob } from '../../services/backgroundJobWorkerService.js';
import { tracer } from '../../config/telemetry.js';
import { logger } from '../../lib/logger.js';

export async function processBackgroundJob(job: Job<EnqueuedJobData>): Promise<void> {
  const { tenantId, userId, jobId, moduleId, kind, payload } = job.data;

  logger.info(
    { jobId, moduleId, kind, queue: job.queueName, attempt: job.attemptsMade + 1 },
    'Processing job',
  );

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
