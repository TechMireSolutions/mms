/** Max JSON body for bulk sync upload (default 10 MiB). Override via `MMS_SYNC_MAX_BODY_BYTES`. */
export const SYNC_MAX_BODY_BYTES =
  Number(process.env.MMS_SYNC_MAX_BODY_BYTES) || 10 * 1024 * 1024;
