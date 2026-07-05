import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_GLOBAL_SETTINGS, getPasswordPolicyHint } from "@mms/shared";
import { OnboardingData } from "@/platform/pages/onboarding/OnboardingWizard";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_INPUT_ICON, FORM_LABEL, FORM_CHECKBOX } from "@/components/ui/formStyles";
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

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
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
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = (field: keyof OnboardingData, fieldValue: unknown) => {
    onChange((prev) => ({ ...prev, [field]: fieldValue } as OnboardingData));
  };
  const strength = getStrength(data.password || "");

  return (
    <div className="space-y-4">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <FieldRow label="First Name" required>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={data.firstName || ""}
            onChange={(event) => update("firstName", event.target.value)}
            placeholder="Abdullah"
            className={FORM_INPUT}
          />
        </FieldRow>
        <FieldRow label="Last Name" required>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={data.lastName || ""}
            onChange={(event) => update("lastName", event.target.value)}
            placeholder="Khan"
            className={FORM_INPUT}
          />
        </FieldRow>
      </div>

      <FieldRow label="Email Address" required>
        <input
          id="email"
          name="email"
          type="email"
          value={data.email || ""}
          onChange={(event) => update("email", event.target.value)}
          placeholder="admin@madrasa.app"
          className={FORM_INPUT}
        />
      </FieldRow>

      <FieldRow label="Phone Number">
        <input
          id="phone"
          name="phone"
          type="tel"
          value={data.phone || ""}
          onChange={(event) => update("phone", event.target.value)}
          placeholder="+44 7700 900000"
          className={FORM_INPUT}
        />
      </FieldRow>

      {/* Password */}
      <FieldRow
        label="Password"
        required
        hint={getPasswordPolicyHint(DEFAULT_GLOBAL_SETTINGS.passwordPolicy)}
      >
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            value={data.password || ""}
            onChange={(event) => update("password", event.target.value)}
            placeholder="••••••••"
            className={cn(FORM_INPUT_ICON, "pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.password && (
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
              {strengthLabels[strength]} password
            </p>
          </div>
        )}
      </FieldRow>

      {/* Confirm password */}
      <FieldRow label="Confirm Password" required>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={data.confirmPassword || ""}
            onChange={(event) => update("confirmPassword", event.target.value)}
            placeholder="••••••••"
            className={cn(
              FORM_INPUT_ICON,
              "pr-11",
              data.confirmPassword && data.password !== data.confirmPassword
                ? "border-destructive focus:ring-destructive/20"
                : "",
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="text-xs text-destructive mt-1">Passwords do not match</p>
        )}
      </FieldRow>

      {/* Terms */}
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="terms"
          checked={data.agreedTerms || false}
          onChange={(event) => update("agreedTerms", event.target.checked)}
          className={`${FORM_CHECKBOX} mt-0.5`}
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
          {t("onboarding.agreeTerms")}
        </label>
      </div>
    </div>
  );
}
