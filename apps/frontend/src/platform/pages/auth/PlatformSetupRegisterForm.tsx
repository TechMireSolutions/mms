import React from "react";
import { User } from "lucide-react";
import {
  AuthEmailField,
  AuthPasswordField,
  AuthStatusBanner,
  AuthSubmitButton,
  AuthTextField,
} from "@/components/entry";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface PlatformSetupRegisterFormProps {
  t: TranslationFunction;
  smtpConfigured: boolean;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  loading: boolean;
  onRegister: (event: React.FormEvent) => Promise<void>;
  onClearError: () => void;
}

function PasswordStrengthMeter({ password, t }: { password: string; t: TranslationFunction }): React.JSX.Element | null {
  if (!password) return null;

  const checks = [
    { label: t("auth.passwordCheckLength"), pass: password.length >= 8 },
    { label: t("auth.passwordCheckUpper"), pass: /[A-Z]/.test(password) },
    { label: t("auth.passwordCheckNumber"), pass: /[0-9]/.test(password) },
    { label: t("auth.passwordCheckSymbol"), pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.pass).length;
  const strengthColor =
    score <= 1
      ? "bg-destructive text-destructive"
      : score === 2
        ? "bg-amber-500 text-amber-500"
        : score === 3
          ? "bg-primary text-primary"
          : "bg-emerald-500 text-emerald-500";

  const strengthLabel =
    score <= 1 ? t("auth.passwordStrengthWeak") : score === 2 ? t("auth.passwordStrengthFair") : score === 3 ? t("auth.passwordStrengthGood") : t("auth.passwordStrengthStrong");

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{t("auth.passwordStrength")}</span>
        <span className="font-semibold text-xs capitalize">{strengthLabel}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden bg-muted">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full transition-all duration-300 ${
              score >= step ? strengthColor.split(" ")[0] : "bg-transparent"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1 pt-1">
        {checks.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              item.pass ? "text-emerald-500 font-semibold" : "text-muted-foreground/75"
            }`}
          >
            <span>{item.pass ? "✓" : "○"}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformSetupRegisterForm({
  t,
  smtpConfigured,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onRegister,
  onClearError,
}: PlatformSetupRegisterFormProps): React.JSX.Element {
  return (
    <PlatformAuthLayout title={t("platform.setupTitle")} subtitle={t("platform.setupSubtitle")}>
      <form onSubmit={(event) => void onRegister(event)} className="space-y-4" noValidate aria-busy={loading}>
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            👑
          </div>
          <div className="text-xs min-w-0">
            <p className="font-bold text-foreground">{t("platform.setupNoticeTitle")}</p>
            <p className="text-muted-foreground truncate">{t("platform.setupNoticeDesc")}</p>
          </div>
        </div>

        {error ? <AuthStatusBanner message={error} /> : null}

        <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
          <AuthTextField
            id="platform-setup-name"
            label={t("platform.setupFullName")}
            value={name}
            autoFocus
            autoComplete="name"
            icon={User}
            onChange={(value) => {
              setName(value);
              onClearError();
            }}
          />

          <AuthEmailField
            id="platform-setup-email"
            label={t("auth.emailAddress")}
            value={email}
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            onChange={(value) => {
              setEmail(value);
              onClearError();
            }}
          />

          <div>
            <AuthPasswordField
              id="platform-setup-password"
              label={t("auth.password")}
              autoComplete="new-password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                onClearError();
              }}
            />
            <PasswordStrengthMeter password={password} t={t} />
          </div>

          <AuthSubmitButton
            busy={loading}
            busyLabel={t("common.save")}
            label={t("platform.setupCreateAccount")}
          />
        </fieldset>
      </form>
    </PlatformAuthLayout>
  );
}
