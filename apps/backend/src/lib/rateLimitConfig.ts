export const AUTH_RATE_LIMIT = {
  max: process.env.NODE_ENV !== 'production' ? 1000 : 10,
  timeWindow: '1 minute' as const,
  errorResponseBuilder: () => ({
    type: 'rate_limit_exceeded',
    message: 'Too many requests. Please try again later.',
  }),
};

/** Rate limit for messaging audit log POSTs (dispatch history writes). */
export const MESSAGING_LOG_RATE_LIMIT = {
  max: process.env.NODE_ENV !== 'production' ? 1000 : 30,
  timeWindow: '1 minute' as const,
  errorResponseBuilder: () => ({
    type: 'rate_limit_exceeded',
    message: 'Too many message log requests. Please try again later.',
  }),
};
