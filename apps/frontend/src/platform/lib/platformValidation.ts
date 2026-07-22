import {
  validatePlatformSetupEmail,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
  validatePlatformPasswordMatch,
  PLATFORM_MIN_PASSWORD_LENGTH,
  type AppTranslationKey,
} from "@mms/shared";

type TranslateFn = (key: AppTranslationKey, params?: Record<string, string>) => string;

/**
 * Validates platform setup email and returns translated error message, or null if valid.
 */
export function getPlatformEmailError(email: string, t: TranslateFn): string | null {
  const key = validatePlatformSetupEmail(email);
  return key ? t(key) : null;
}

/**
 * Validates platform setup name and returns translated error message, or null if valid.
 */
export function getPlatformNameError(name: string, t: TranslateFn): string | null {
  const key = validatePlatformSetupName(name);
  return key ? t(key) : null;
}

/**
 * Validates platform setup password and returns translated error message, or null if valid.
 */
export function getPlatformPasswordError(password: string, t: TranslateFn): string | null {
  const key = validatePlatformSetupPassword(password);
  if (!key) return null;
  return key === "platform.setupPasswordTooShort"
    ? t(key, { min: String(PLATFORM_MIN_PASSWORD_LENGTH) })
    : t(key);
}

/**
 * Validates platform password match and returns translated error message, or null if matched.
 */
export function getPlatformPasswordMatchError(
  password: string,
  confirmPassword: string,
  t: TranslateFn
): string | null {
  const key = validatePlatformPasswordMatch(password, confirmPassword);
  return key ? t(key) : null;
}

