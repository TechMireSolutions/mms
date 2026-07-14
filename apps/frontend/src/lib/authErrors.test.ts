import { describe, expect, it } from 'vitest';
import { isAuthErrorType, parseAuthError } from '@/lib/authErrors';

describe('authErrors', () => {
  it('preserves known backend auth error types', async () => {
    const response = new Response(
      JSON.stringify({
        type: 'email_not_verified',
        message: 'Verify your email before signing in',
      }),
      { status: 403 },
    );

    await expect(parseAuthError(response)).resolves.toEqual({
      type: 'email_not_verified',
      message: 'Verify your email before signing in',
    });
  });

  it('accepts workspace disabled errors', () => {
    expect(isAuthErrorType('workspace_disabled')).toBe(true);
  });

  it('accepts all client auth error categories', () => {
    expect(isAuthErrorType('connection_error')).toBe(true);
    expect(isAuthErrorType('auth_required')).toBe(true);
    expect(isAuthErrorType('user_not_registered')).toBe(true);
  });

  it('falls back to invalid credentials for unknown JSON auth errors', async () => {
    const response = new Response(
      JSON.stringify({
        type: 'unexpected_backend_type',
        message: 'Backend still sent a useful message',
      }),
      { status: 401 },
    );

    await expect(parseAuthError(response)).resolves.toEqual({
      type: 'invalid_credentials',
      message: 'Backend still sent a useful message',
    });
  });

  it('falls back safely when an error response has no JSON body', async () => {
    const response = new Response('not-json', { status: 500 });

    await expect(parseAuthError(response)).resolves.toEqual({
      type: 'connection_error',
      message: 'Login failed',
    });
  });
});
