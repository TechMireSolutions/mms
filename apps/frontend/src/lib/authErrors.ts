import {
  TENANT_AUTH_ERROR_TYPES,
  type TenantAuthErrorType,
} from '@mms/shared';
import { ApiError } from '@/lib/apiClient';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';

export interface AuthError {
  type: TenantAuthErrorType;
  message: string;
}

export function isAuthErrorType(value: unknown): value is TenantAuthErrorType {
  return typeof value === 'string' && (TENANT_AUTH_ERROR_TYPES as readonly string[]).includes(value);
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

function mapTenantAuthErrorType(
  type: TenantAuthErrorType,
  fallbackMessage: string,
  t: TranslationFunction,
): string {
  switch (type) {
    case 'invalid_credentials':
      return t('auth.invalidCredentials');
    case 'email_not_verified':
      return t('auth.emailNotVerified');
    case 'workspace_disabled':
      return fallbackMessage || t('errors.state.permission');
    case 'connection_error':
      return t('errors.state.network');
    default:
      return fallbackMessage || t('auth.invalidCredentials');
  }
}

/**
 * Maps tenant auth failures to localized copy, preventing raw backend English
 * strings from leaking into non-English locales (Arabic, Urdu, Persian).
 */
export function getAuthErrorMessage(
  error: unknown,
  t: TranslationFunction,
): string {
  const authErr =
    error && typeof error === 'object' && 'authError' in error
      ? (error as { authError: AuthError }).authError
      : undefined;

  if (authErr) {
    return mapTenantAuthErrorType(authErr.type, authErr.message, t);
  }

  if (error instanceof ApiError) {
    if (isAuthErrorType(error.type)) {
      return mapTenantAuthErrorType(error.type, error.message, t);
    }
    if (error.status === 401) {
      return t('auth.invalidCredentials');
    }
    if (error.status === 403) {
      return error.message || t('errors.state.permission');
    }
  }

  if (error instanceof Error) {
    return error.message;
  }
  return t('auth.invalidCredentials');
}

