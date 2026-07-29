import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_GLOBAL_SETTINGS, getPasswordPolicyHintKey } from "@mms/shared";
import { OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { AuthEmailField, AuthPasswordField } from "@/components/entry";
import { cn } from "@/lib/utils";

/** The subset of onboarding data used by this step. */
export interface AdminSetupData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agreedTerms?: boolean;
}

interface FieldRowProps {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

const FieldRow = ({ id, label, required = false, children, hint }: FieldRowProps) => (
  <div className="space-y-1.5 text-start">
    <label htmlFor={id} className={FORM_LABEL}>
      {label}
      {required ? <span className="ms-1 text-destructive" aria-hidden>*</span> : null}
    </label>
    {children}
    {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
  </div>
);

const strengthColors = ["", "bg-destructive", "bg-warning", "bg-warning", "bg-primary"];

function getStrength(passwordValue: string): number {
  let score = 0;
  if (passwordValue.length >= 8) score++;
  if (/[A-Z]/.test(passwordValue)) score++;
  if (/[0-9]/.test(passwordValue)) score++;
  if (/[^A-Za-z0-9]/.test(passwordValue)) score++;
  return score;
}

interface AdminSetupProps {
  data: OnboardingData;
  onChange: Dispatch<SetStateAction<OnboardingData>>;
}

/**
 * AdminSetup step component for onboarding.
 */
export default function AdminSetup({ data, onChange }: AdminSetupProps) {
  const { t } = useTranslation();

  const update = (field: keyof OnboardingData, fieldValue: unknown) => {
    onChange((prev) => ({ ...prev, [field]: fieldValue } as OnboardingData));
  };
  const strength = getStrength(data.password || "");
  const passwordMismatch =
    Boolean(data.confirmPassword) && data.password !== data.confirmPassword;

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldRow id="firstName" label={t("onboarding.admin.firstName")} required>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            autoFocus
            required
            value={data.firstName || ""}
            onChange={(event) => update("firstName", event.target.value)}
            placeholder={t("onboarding.admin.firstNamePlaceholder")}
            className="h-11"
          />
        </FieldRow>
        <FieldRow id="lastName" label={t("onboarding.admin.lastName")} required>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            value={data.lastName || ""}
            onChange={(event) => update("lastName", event.target.value)}
            placeholder={t("onboarding.admin.lastNamePlaceholder")}
            className="h-11"
          />
        </FieldRow>
      </div>

      <AuthEmailField
        id="email"
        label={t("onboarding.admin.email")}
        value={data.email || ""}
        placeholder={t("onboarding.admin.emailPlaceholder")}
        onChange={(value) => update("email", value)}
      />

      <FieldRow id="phone" label={t("onboarding.admin.phone")}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={data.phone || ""}
          onChange={(event) => update("phone", event.target.value)}
          placeholder={t("onboarding.admin.phonePlaceholder")}
          className="h-11"
        />
      </FieldRow>

      <div className="space-y-1.5">
        <AuthPasswordField
          id="password"
          label={t("onboarding.admin.password")}
          autoComplete="new-password"
          value={data.password || ""}
          placeholder={t("auth.passwordPlaceholder")}
          onChange={(value) => update("password", value)}
          describedBy="onboarding-password-hint"
        />
        <p id="onboarding-password-hint" className="text-xs leading-relaxed text-muted-foreground">
          {t(getPasswordPolicyHintKey(DEFAULT_GLOBAL_SETTINGS.passwordPolicy))}
        </p>
        {data.password ? (
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
        value={data.confirmPassword || ""}
        placeholder={t("auth.passwordPlaceholder")}
        onChange={(value) => update("confirmPassword", value)}
        error={passwordMismatch ? t("onboarding.admin.passwordMismatch") : undefined}
      />

      <label
        htmlFor="terms"
        className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg pt-1 select-none"
      >
        <Checkbox
          id="terms"
          checked={data.agreedTerms || false}
          onCheckedChange={(checked) => update("agreedTerms", checked === true)}
          className="mt-0.5"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          {t("onboarding.agreeTerms")}
        </span>
      </label>
    </div>
  );
}
