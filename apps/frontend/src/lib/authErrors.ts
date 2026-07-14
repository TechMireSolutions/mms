export interface AuthError {
  type:
    | 'invalid_credentials'
    | 'auth_required'
    | 'connection_error'
    | 'user_not_registered'
    | 'workspace_disabled'
    | 'email_not_verified'
    | 'validation_error';
  message: string;
}

export function isAuthErrorType(value: unknown): value is AuthError['type'] {
  return (
    value === 'invalid_credentials' ||
    value === 'auth_required' ||
    value === 'connection_error' ||
    value === 'user_not_registered' ||
    value === 'workspace_disabled' ||
    value === 'email_not_verified' ||
    value === 'validation_error'
  );
}

export async function parseAuthError(response: Response): Promise<AuthError> {
  try {
    const data = await response.json() as { type?: unknown; message?: unknown };
    return {
      type: isAuthErrorType(data.type) ? data.type : 'invalid_credentials',
      message: typeof data.message === 'string' && data.message.trim() ? data.message : 'Login failed',
    };
  } catch {
    return {
      type: response.status === 401 ? 'invalid_credentials' : 'connection_error',
      message: 'Login failed',
    };
  }
}
