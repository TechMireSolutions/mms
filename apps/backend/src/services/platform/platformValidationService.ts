import {
  validatePlatformSetupEmail,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
  type PlatformPasswordForgotResult,
  type PlatformSetupRegisterResult,
} from '@mms/shared';
import { PlatformError } from './platformErrorService.js';

/**
 * Validates platform setup/admin email and throws PlatformError if invalid.
 */
export function enforcePlatformEmail(email: string): void {
  const emailError = validatePlatformSetupEmail(email);
  if (emailError) {
    throw new PlatformError('invalid_email', 'Invalid email address');
  }
}

/**
 * Validates platform setup/admin display name and throws PlatformError if invalid.
 */
export function enforcePlatformName(name: string): void {
  const nameError = validatePlatformSetupName(name);
  if (nameError) {
    throw new PlatformError('invalid_name', 'Invalid display name');
  }
}

/**
 * Validates platform setup/admin password strength and throws PlatformError if invalid.
 */
export function enforcePlatformPassword(password: string): void {
  const passwordError = validatePlatformSetupPassword(password);
  if (passwordError === 'platform.setupPasswordTooShort') {
    throw new PlatformError('password_too_short', 'Password does not meet minimum length');
  }
  if (passwordError === 'platform.setupPasswordWeak') {
    throw new PlatformError('password_weak', 'Password does not meet complexity requirements');
  }
}

/**
 * Normalizes OTP dispatching results for non-production environments to avoid code duplication in password reset flows.
 */
export function buildDevForgotResult(
  dispatch: { sent: boolean; devCode?: string },
  resetId: string,
): PlatformPasswordForgotResult {
  const result: PlatformPasswordForgotResult = { accepted: true };
  if (process.env.NODE_ENV !== 'production' && dispatch.devCode) {
    result.devReset = { resetId, code: dispatch.devCode };
  }
  return result;
}

/**
 * Normalizes OTP dispatching results for non-production environments to avoid code duplication in setup flows.
 */
export function buildSetupRegisterResult(
  dispatch: { sent: boolean; devCode?: string },
  setupId: string,
  email: string,
): PlatformSetupRegisterResult {
  return {
    setupId,
    email,
    emailSent: dispatch.sent,
    devCode: dispatch.devCode,
  };
}
