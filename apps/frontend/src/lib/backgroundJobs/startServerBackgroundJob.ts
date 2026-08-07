import type { BackgroundJobRecord } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { upsertLocalBackgroundJob } from '@/lib/backgroundJobs/backgroundJobStore';
import { pollBackgroundJobUntilDone } from '@/lib/backgroundJobs/pollBackgroundJob';

/**
 * POST a background job endpoint, upsert locally, and poll while pending/running.
 */
export async function startServerBackgroundJob(options: {
  path: string;
  body?: Record<string, unknown>;
}): Promise<BackgroundJobRecord> {
  const jobResponse = await apiJson<{ job: BackgroundJobRecord }>(options.path, {
    method: 'POST',
    body: JSON.stringify(options.body ?? {}),
  });
  upsertLocalBackgroundJob(jobResponse.job);

  if (
    jobResponse.job.status === 'running' ||
    jobResponse.job.status === 'pending'
  ) {
    return pollBackgroundJobUntilDone(jobResponse.job.id);
  }
  return jobResponse.job;
}
