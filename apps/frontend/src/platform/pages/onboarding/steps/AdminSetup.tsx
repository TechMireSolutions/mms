import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_GLOBAL_SETTINGS, getPasswordPolicyHint } from "@mms/shared";
import { OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_LABEL } from "@/components/ui/formStyles";
import PlatformPasswordInput from "@/platform/components/PlatformPasswordInput";

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
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

const FieldRow = ({ label, required = false, children, hint }: FieldRowProps) => (
  <div>
    <label className={FORM_LABEL}>
      {label} {required ? <span className="text-destructive">*</span> : null}
    </label>
    {children}
    {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
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
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label={t("onboarding.admin.firstName")} required>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={data.firstName || ""}
            onChange={(event) => update("firstName", event.target.value)}
            placeholder={t("onboarding.admin.firstNamePlaceholder")}
          />
        </FieldRow>
        <FieldRow label={t("onboarding.admin.lastName")} required>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={data.lastName || ""}
            onChange={(event) => update("lastName", event.target.value)}
            placeholder={t("onboarding.admin.lastNamePlaceholder")}
          />
        </FieldRow>
      </div>

      <FieldRow label={t("onboarding.admin.email")} required>
        <Input
          id="email"
          name="email"
          type="email"
          value={data.email || ""}
          onChange={(event) => update("email", event.target.value)}
          placeholder={t("onboarding.admin.emailPlaceholder")}
        />
      </FieldRow>

      <FieldRow label={t("onboarding.admin.phone")}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={data.phone || ""}
          onChange={(event) => update("phone", event.target.value)}
          placeholder={t("onboarding.admin.phonePlaceholder")}
        />
      </FieldRow>

      {/* Password */}
      <div>
        <PlatformPasswordInput
          id="password"
          name="password"
          label={`${t("onboarding.admin.password")} *`}
          autoComplete="new-password"
          required
          value={data.password || ""}
          onChange={(event) => update("password", event.target.value)}
          placeholder="••••••••"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {getPasswordPolicyHint(DEFAULT_GLOBAL_SETTINGS.passwordPolicy)}
        </p>
        {data.password ? (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    strength >= level ? strengthColors[strength] : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-medium ${
              strength <= 1 ? "text-destructive" : strength === 2 ? "text-warning" : strength === 3 ? "text-warning" : "text-primary"
            }`}>
              {getStrengthLabel(strength)}
            </p>
          </div>
        ) : null}
      </div>

      {/* Confirm password */}
      <div>
        <PlatformPasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label={`${t("onboarding.admin.confirmPassword")} *`}
          autoComplete="new-password"
          required
          value={data.confirmPassword || ""}
          onChange={(event) => update("confirmPassword", event.target.value)}
          placeholder="••••••••"
        />
        {data.confirmPassword && data.password !== data.confirmPassword ? (
          <p className="text-xs text-destructive mt-1">{t("onboarding.admin.passwordMismatch")}</p>
        ) : null}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2.5 pt-1">
        <Checkbox
          id="terms"
          checked={data.agreedTerms || false}
          onCheckedChange={(checked) => update("agreedTerms", checked === true)}
          className="mt-0.5"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
          {t("onboarding.agreeTerms")}
        </label>
      </div>
    </div>
  );
}

