import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/apiClient';
import {
  getPlatformErrorMessage,
  mapPlatformAuthError,
} from '@/platform/lib/platformAuthErrors';
import type { AppTranslationKey } from '@mms/shared';

const EN: Record<string, string> = {
  'platform.setupInvalidEmail': 'Enter a valid email address',
  'platform.invalidCredentials': 'Invalid platform credentials',
  'errors.boundary.description': 'Something went wrong. Reload the page or try again later.',
};

function t(key: AppTranslationKey): string {
  return EN[key] ?? key;
}

describe('platformAuthErrors', () => {
  it('maps known ApiError types to translation keys', () => {
    expect(mapPlatformAuthError(new ApiError(400, 'bad', 'invalid_email'), t)).toBe(
      'Enter a valid email address',
    );
    expect(mapPlatformAuthError(new ApiError(401, 'nope', 'invalid_credentials'), t)).toBe(
      'Invalid platform credentials',
    );
    expect(mapPlatformAuthError(new ApiError(409, 'exists', 'setup_not_needed'), t)).toBe(
      'platform.setupNotNeeded',
    );
  });

  it('does not surface raw API messages for unknown types', () => {
    expect(
      mapPlatformAuthError(new ApiError(500, 'SQL boom detail', 'server_error'), t),
    ).toBe('Something went wrong. Reload the page or try again later.');
  });

  it('maps generic errors without leaking Error.message', () => {
    expect(getPlatformErrorMessage(new Error('secret stack detail'), t)).toBe(
      'Something went wrong. Reload the page or try again later.',
    );
    expect(getPlatformErrorMessage('weird', t)).toBe(
      'Something went wrong. Reload the page or try again later.',
    );
  });
});
