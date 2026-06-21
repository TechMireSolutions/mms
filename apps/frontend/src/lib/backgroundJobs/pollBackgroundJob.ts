import type { BackgroundJobRecord } from '@mms/shared';
import { BACKGROUND_JOBS_API_PATH } from '@mms/shared';
import { apiJson } from '@/lib/apiClient';
import { upsertLocalBackgroundJob } from '@/lib/backgroundJobs/backgroundJobStore';

const POLL_INTERVAL_MS = 1_500;
const DEFAULT_TIMEOUT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchBackgroundJob(jobId: string): Promise<BackgroundJobRecord | null> {
  try {
    const body = await apiJson<{ job: BackgroundJobRecord }>(`${BACKGROUND_JOBS_API_PATH}/${jobId}`);
    return body.job;
  } catch {
    return null;
  }
}

/** Polls until a background job completes, fails, or times out. */
export async function pollBackgroundJobUntilDone(
  jobId: string,
  options?: { timeoutMs?: number; onUpdate?: (job: BackgroundJobRecord) => void },
): Promise<BackgroundJobRecord> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const job = await fetchBackgroundJob(jobId);
    if (job) {
      upsertLocalBackgroundJob(job);
      options?.onUpdate?.(job);
      if (job.status === 'completed') return job;
      if (job.status === 'failed') {
        throw new Error(job.error ?? 'Background job failed');
      }
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Background job timed out');
}
