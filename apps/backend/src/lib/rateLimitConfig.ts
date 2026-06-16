export const AUTH_RATE_LIMIT = {
  max: 10,
  timeWindow: '1 minute' as const,
  errorResponseBuilder: () => ({
    type: 'rate_limit_exceeded',
    message: 'Too many requests. Please try again later.',
  }),
};
