import { runWithTenant } from '../lib/tenantContext.js';
import { withTenantTransaction } from '../db/withTenantTransaction.js';

export interface BackgroundJobData<T = Record<string, unknown>> {
  id: string;
  workspaceSubdomain: string;
  jobType: string;
  payload: T;
  createdAt: Date;
}

export type JobWorkerHandler<T = Record<string, unknown>> = (
  job: BackgroundJobData<T>
) => Promise<void>;

class QueueEngine {
  private workers = new Map<string, JobWorkerHandler>();
  private isRunning = false;

  /**
   * Registers a job worker for a specific job type.
   */
  public registerWorker<T = Record<string, unknown>>(
    jobType: string,
    handler: JobWorkerHandler<T>
  ): void {
    this.workers.set(jobType, handler as JobWorkerHandler);
  }

  /**
   * Enqueues and executes a background job safely within an AsyncLocalStorage tenant context.
   */
  public async processJob<T = Record<string, unknown>>(job: BackgroundJobData<T>): Promise<void> {
    const handler = this.workers.get(job.jobType);
    if (!handler) {
      throw new Error(`No registered worker for job type: ${job.jobType}`);
    }

    // Execute job inside tenant storage context & RLS transaction
    return runWithTenant(job.workspaceSubdomain, async () => {
      return withTenantTransaction(job.workspaceSubdomain, async () => {
        await handler(job as BackgroundJobData);
      });
    });
  }

  public start(): void {
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
  }

  public getStatus(): { isRunning: boolean; registeredWorkers: string[] } {
    return {
      isRunning: this.isRunning,
      registeredWorkers: Array.from(this.workers.keys()),
    };
  }
}

export const queueEngine = new QueueEngine();
