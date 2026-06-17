import { PLATFORM_MIN_PASSWORD_LENGTH } from "@mms/shared";
import type { AppTranslationKey } from "@mms/shared";
import { ApiError } from "@/lib/apiClient";

type TranslateFn = (key: AppTranslationKey, params?: Record<string, string>) => string;

/** Maps platform setup / password-reset API errors to translated copy. */
export function mapPlatformAuthError(apiError: ApiError, t: TranslateFn): string {
  switch (apiError.type) {
    case "invalid_email":
      return t("platform.setupInvalidEmail");
    case "invalid_name":
      return t("platform.setupInvalidName");
    case "password_too_short":
      return t("platform.setupPasswordTooShort", { min: String(PLATFORM_MIN_PASSWORD_LENGTH) });
    case "password_weak":
      return t("platform.setupPasswordWeak");
    case "smtp_required":
      return t("platform.setupSmtpRequired");
    case "email_send_failed":
      return t("platform.setupEmailFailed");
    case "invalid_code":
      return t("platform.setupInvalidCode");
    case "invalid_reset":
      return t("platform.forgotResetExpired");
    case "invalid_current_password":
      return t("platform.profileWrongPassword");
    default:
      return apiError.message || t("errors.boundary.description");
  }
}
