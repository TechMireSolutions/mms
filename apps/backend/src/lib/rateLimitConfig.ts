interface RateLimitErrorContext {
  statusCode: number;
}

function buildRateLimitError(message: string, context: RateLimitErrorContext) {
  return {
    statusCode: context.statusCode,
    code: 'rate_limit_exceeded',
    type: 'rate_limit_exceeded',
    message,
  };
}

export const AUTH_RATE_LIMIT = {
  max: process.env.NODE_ENV !== 'production' ? 1000 : 10,
  timeWindow: '1 minute' as const,
  errorResponseBuilder: (_request: unknown, context: RateLimitErrorContext) =>
    buildRateLimitError('Too many requests. Please try again later.', context),
};

/** Rate limit for messaging write paths (dispatch log POSTs and export enqueue). */
export const MESSAGING_LOG_RATE_LIMIT = {
  max: process.env.NODE_ENV !== 'production' ? 1000 : 30,
  timeWindow: '1 minute' as const,
  errorResponseBuilder: (_request: unknown, context: RateLimitErrorContext) =>
    buildRateLimitError(
      'Too many message log requests. Please try again later.',
      context,
    ),
};
