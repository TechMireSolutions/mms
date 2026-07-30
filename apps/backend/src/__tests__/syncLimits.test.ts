import { describe, expect, it } from 'vitest';
import { SYNC_ABORTED_MESSAGE, throwIfSyncAborted, withSyncTimeout } from '../lib/syncLimits.js';

describe('withSyncTimeout', () => {
  it('returns the operation result when it finishes in time', async () => {
    await expect(withSyncTimeout(async () => 'done', 500)).resolves.toBe('done');
  });

  it('aborts the operation and waits for rollback before rejecting with 408', async () => {
    let rolledBack = false;

    const result = withSyncTimeout(async (signal) => {
      try {
        await new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => resolve(), { once: true });
        });
        throwIfSyncAborted(signal);
      } catch (error) {
        // Simulates the transaction unwinding before the response is sent.
        await new Promise((resolve) => setTimeout(resolve, 10));
        rolledBack = true;
        throw error;
      }
    }, 20);

    await expect(result).rejects.toMatchObject({
      message: SYNC_ABORTED_MESSAGE,
      statusCode: 408,
      type: 'server_error',
    });
    expect(rolledBack).toBe(true);
  });

  it('propagates operation failures unchanged when no timeout fired', async () => {
    await expect(
      withSyncTimeout(async () => {
        throw new Error('backup.missingAdminUser');
      }, 500),
    ).rejects.toThrow('backup.missingAdminUser');
  });
});
