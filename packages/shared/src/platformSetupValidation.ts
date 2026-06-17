import type { AppTranslationKey } from './appTranslations.js';
import { PLATFORM_MIN_PASSWORD_LENGTH } from './platformTypes.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePlatformEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePlatformSetupEmail(email: string): AppTranslationKey | null {
  const normalized = normalizePlatformEmail(email);
  if (!normalized || !EMAIL_RE.test(normalized)) {
    return 'platform.setupInvalidEmail';
  }
  return null;
}

export function validatePlatformSetupName(name: string): AppTranslationKey | null {
  if (name.trim().length < 2) {
    return 'platform.setupInvalidName';
  }
  return null;
}

export function validatePlatformSetupPassword(password: string): AppTranslationKey | null {
  if (password.length < PLATFORM_MIN_PASSWORD_LENGTH) {
    return 'platform.setupPasswordTooShort';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'platform.setupPasswordWeak';
  }
  return null;
}
