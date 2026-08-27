import React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { AuthEmailField } from "@/components/entry";
import { AdminSetupPasswordFields } from "@/platform/pages/onboarding/steps/AdminSetupPasswordFields";

/** The subset of onboarding data used by this step. */
export interface AdminSetupData {
  firstName?: string;
  lastName?: string;
  email?: string;
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

      <AdminSetupPasswordFields
        password={data.password || ""}
        confirmPassword={data.confirmPassword || ""}
        onPasswordChange={(value) => update("password", value)}
        onConfirmPasswordChange={(value) => update("confirmPassword", value)}
      />

      <label
        htmlFor="terms"
        className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg pt-1 select-none"
      >
        <Checkbox
          id="terms"
          name="terms"
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
