/** Max JSON body for bulk sync upload (default 50 MiB). Override via `MMS_SYNC_MAX_BODY_BYTES`. */
export const SYNC_MAX_BODY_BYTES =
  Number(process.env.MMS_SYNC_MAX_BODY_BYTES) || 50 * 1024 * 1024;

/** Wall-clock cap for bulk sync processing (default 2 min). Override via `MMS_SYNC_REQUEST_TIMEOUT_MS`. */
export const SYNC_REQUEST_TIMEOUT_MS =
  Number(process.env.MMS_SYNC_REQUEST_TIMEOUT_MS) || 120_000;

export async function withSyncTimeout<T>(
  operation: Promise<T>,
  timeoutMs = SYNC_REQUEST_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        Object.assign(new Error('Bulk sync timed out'), {
          statusCode: 408,
          type: 'server_error',
        }),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
