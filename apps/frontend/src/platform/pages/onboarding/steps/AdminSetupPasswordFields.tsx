import React from "react";
import { DEFAULT_GLOBAL_SETTINGS, getPasswordPolicyHintKey, estimatePasswordStrength } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { AuthPasswordField } from "@/components/entry";
import { cn } from "@/lib/utils";

const strengthColors = ["", "bg-destructive", "bg-warning", "bg-warning", "bg-primary"];

/** Maps the shared entropy estimate (0–5) to the platform meter's 0–4 scale. */
function getPasswordStrength(passwordValue: string): number {
  const { score } = estimatePasswordStrength(passwordValue);
  return score === 0 ? 0 : Math.min(4, score);
}

export interface AdminSetupPasswordFieldsProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}

export function AdminSetupPasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
}: AdminSetupPasswordFieldsProps): React.JSX.Element {
  const { t } = useTranslation();
  const strength = getPasswordStrength(password);
  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  const getStrengthLabel = (score: number): string => {
    switch (score) {
      case 1:
        return t("onboarding.admin.passwordWeak");
      case 2:
        return t("onboarding.admin.passwordFair");
      case 3:
        return t("onboarding.admin.passwordGood");
      case 4:
        return t("onboarding.admin.passwordStrong");
      default:
        return "";
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <AuthPasswordField
          id="password"
          label={t("onboarding.admin.password")}
          autoComplete="new-password"
          value={password}
          placeholder={t("auth.passwordPlaceholder")}
          onChange={onPasswordChange}
          describedBy="onboarding-password-hint"
        />
        <p id="onboarding-password-hint" className="text-xs leading-relaxed text-muted-foreground">
          {t(getPasswordPolicyHintKey(DEFAULT_GLOBAL_SETTINGS.passwordPolicy))}
        </p>
        {password ? (
          <div className="mt-2 space-y-1" aria-live="polite">
            <div
              className="flex gap-1"
              role="meter"
              aria-valuenow={strength}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-label={getStrengthLabel(strength)}
            >
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    strength >= level ? strengthColors[strength] : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                "text-xs font-medium",
                strength <= 1
                  ? "text-destructive"
                  : strength <= 3
                    ? "text-warning"
                    : "text-primary",
              )}
            >
              {getStrengthLabel(strength)}
            </p>
          </div>
        ) : null}
      </div>

      <AuthPasswordField
        id="confirmPassword"
        label={t("onboarding.admin.confirmPassword")}
        autoComplete="new-password"
        value={confirmPassword}
        placeholder={t("auth.passwordPlaceholder")}
        onChange={onConfirmPasswordChange}
        error={passwordMismatch ? t("onboarding.admin.passwordMismatch") : undefined}
      />
    </>
  );
}
