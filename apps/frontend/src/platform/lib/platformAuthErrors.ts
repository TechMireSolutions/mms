import { PLATFORM_MIN_PASSWORD_LENGTH } from "@mms/shared";
import type { AppTranslationKey, PlatformApiErrorType } from "@mms/shared";
import { ApiError } from "@/lib/apiClient";

type TranslateFn = (key: AppTranslationKey, params?: Record<string, string>) => string;

const PLATFORM_AUTH_ERROR_KEYS: Partial<Record<PlatformApiErrorType, AppTranslationKey>> = {
  invalid_email: "platform.setupInvalidEmail",
  invalid_name: "platform.setupInvalidName",
  password_too_short: "platform.setupPasswordTooShort",
  password_weak: "platform.setupPasswordWeak",
  smtp_required: "platform.setupSmtpRequired",
  email_send_failed: "platform.setupEmailFailed",
  invalid_code: "platform.setupInvalidCode",
  invalid_setup: "platform.setupSessionExpired",
  invalid_reset: "platform.forgotResetExpired",
  too_many_attempts: "platform.otpTooManyAttempts",
  invalid_current_password: "platform.profileWrongPassword",
  invalid_credentials: "platform.invalidCredentials",
  account_disabled: "platform.accountDisabled",
  setup_not_needed: "platform.setupNotNeeded",
  user_exists: "platform.adminAlreadyExists",
  user_not_found: "platform.adminNotFound",
  forbidden: "platform.actionForbidden",
  remote_migrate_disabled: "platform.profileMigrateRestartDisabled",
  migrate_restart_in_progress: "platform.profileMigrateRestartInProgress",
  rate_limit_exceeded: "platform.rateLimited",
  validation_error: "platform.validationFailed",
  auth_required: "platform.authRequired",
  session_revoked: "platform.sessionRevoked",
  database_error: "platform.databaseError",
  not_found: "platform.resourceNotFound",
};

/** Maps platform setup / password-reset / admin API errors to translated copy. */
export function mapPlatformAuthError(apiError: ApiError, t: TranslateFn): string {
  const type = apiError.type as PlatformApiErrorType;
  const key = PLATFORM_AUTH_ERROR_KEYS[type];
  if (!key) {
    return t("errors.boundary.description");
  }
  if (type === "password_too_short") {
    return t(key, { min: String(PLATFORM_MIN_PASSWORD_LENGTH) });
  }
  return t(key);
}

/** Convenience wrapper to map any caught error (ApiError or generic Error) to a translated string. */
export function getPlatformErrorMessage(error: unknown, t: TranslateFn): string {
  if (error instanceof ApiError) {
    return mapPlatformAuthError(error, t);
  }
  return t("errors.boundary.description");
}
