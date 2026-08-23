import { describe, it, expect, vi } from 'vitest';
import {
  QUEUE_PDF_RENDERING,
  QUEUE_BULK_EXPORT,
  QUEUE_MESSAGING_BROADCAST,
  QUEUE_SETTINGS,
  DEFAULT_JOB_OPTIONS,
  resolveQueueNameForJob,
  handleDeadLetterJob,
  getQueue,
  closeAllQueues,
} from '../worker/queues/index.js';

describe('BullMQ Queue Architecture (Phase 5)', () => {
  it('defines correct queue names and concurrencies', () => {
    expect(QUEUE_SETTINGS[QUEUE_PDF_RENDERING]).toEqual({
      concurrency: 4,
      priority: 1,
    });
    expect(QUEUE_SETTINGS[QUEUE_BULK_EXPORT]).toEqual({
      concurrency: 2,
      priority: 2,
    });
    expect(QUEUE_SETTINGS[QUEUE_MESSAGING_BROADCAST]).toEqual({
      concurrency: 10,
      priority: 3,
    });
  });

  it('configures exponential backoff retry policy', () => {
    expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3);
    expect(DEFAULT_JOB_OPTIONS.backoff).toEqual({
      type: 'exponential',
      delay: 1000,
    });
  });

  it('correctly resolves queue names based on module and kind', () => {
    // PDF rendering jobs
    expect(resolveQueueNameForJob('students', 'export-pdf')).toBe(QUEUE_PDF_RENDERING);
    expect(resolveQueueNameForJob('examination', 'generate-report-card')).toBe(QUEUE_PDF_RENDERING);
    expect(resolveQueueNameForJob('finance', 'fee-receipt-pdf')).toBe(QUEUE_PDF_RENDERING);

    // Messaging broadcast jobs
    expect(resolveQueueNameForJob('messaging', 'send-campaign')).toBe(QUEUE_MESSAGING_BROADCAST);
    expect(resolveQueueNameForJob('notifications', 'broadcast-sms')).toBe(QUEUE_MESSAGING_BROADCAST);
    expect(resolveQueueNameForJob('contacts', 'whatsapp-broadcast')).toBe(QUEUE_MESSAGING_BROADCAST);

    // Bulk export / default jobs
    expect(resolveQueueNameForJob('contacts', 'export-csv')).toBe(QUEUE_BULK_EXPORT);
    expect(resolveQueueNameForJob('contacts', 'export-vcf')).toBe(QUEUE_BULK_EXPORT);
    expect(resolveQueueNameForJob('contacts', 'duplicate-scan')).toBe(QUEUE_BULK_EXPORT);
    expect(resolveQueueNameForJob('users', 'export-csv')).toBe(QUEUE_BULK_EXPORT);
  });

  it('handles dead-letter queue permanently failed jobs gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await handleDeadLetterJob(
      QUEUE_BULK_EXPORT,
      {
        jobId: 'test-job-999',
        tenantId: 'alpha',
        userId: 'user-1',
        moduleId: 'contacts',
        kind: 'export-csv',
        payload: {},
        enqueuedAt: new Date().toISOString(),
      },
      'Rate limit exceeded / timeout after 3 attempts',
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[BullMQ DLQ] Job test-job-999 (contacts:export-csv) in queue "bulk-export" permanently failed'),
    );

    errorSpy.mockRestore();
  });

  it('allows creating queues and closing them cleanly', async () => {
    const queue = getQueue(QUEUE_BULK_EXPORT);
    expect(queue).toBeDefined();
    expect(queue.name).toBe(QUEUE_BULK_EXPORT);

    await closeAllQueues();
  });
});
