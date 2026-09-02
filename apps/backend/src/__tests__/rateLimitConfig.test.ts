import { describe, expect, it } from 'vitest';
import { AUTH_RATE_LIMIT, MESSAGING_LOG_RATE_LIMIT } from '../lib/rateLimitConfig.js';

describe('rateLimitConfig', () => {
  it('MESSAGING_LOG_RATE_LIMIT errorResponseBuilder returns rate_limit_exceeded', () => {
    expect(MESSAGING_LOG_RATE_LIMIT.errorResponseBuilder({}, { statusCode: 429 })).toEqual({
      statusCode: 429,
      code: 'rate_limit_exceeded',
      type: 'rate_limit_exceeded',
      message: 'Too many message log requests. Please try again later.',
    });
  });

  it('AUTH_RATE_LIMIT errorResponseBuilder returns rate_limit_exceeded', () => {
    expect(AUTH_RATE_LIMIT.errorResponseBuilder({}, { statusCode: 429 })).toEqual({
      statusCode: 429,
      code: 'rate_limit_exceeded',
      type: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
    });
  });
});
