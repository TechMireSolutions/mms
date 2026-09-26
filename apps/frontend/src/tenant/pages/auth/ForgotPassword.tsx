import React, { useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/tenant/components/AuthLayout";
import {
  AuthBackLink,
  AuthEmailField,
  AuthPasswordField,
  AuthResendCodeControl,
  AuthStatusBanner,
  AuthSubmitButton,
  EntryPageHead,
  focusAuthField,
  formatEntryTitle,
  validateAuthEmail,
} from "@/components/entry";
import {
  DEFAULT_GLOBAL_SETTINGS,
  getPasswordPolicyHintKey,
  validatePasswordPolicy,
} from "@mms/shared";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { createEmptyOtp, isOtpComplete, OtpInput } from "@/components/ui/OtpInput";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { ROUTES } from '@/lib/config/routes';
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isApiError } from "@/lib/apiClient";
import { notify } from "@/lib/notify";

type View = "email" | "otp" | "reset";
type Flow = "reset" | "activate";

/** Local form wrapper — owns the shared className/noValidate/aria-busy so each view step is DRY. */
function AuthStepForm({
  onSubmit,
  busy,
  children,
}: {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <form
      onSubmit={(event) => onSubmit(event)}
      className="mt-4 space-y-4"
      noValidate
      aria-busy={busy}
    >
      {children}
    </form>
  );
}

/**
 * Tenant "set your password" flow — one OTP mechanism (request code → verify →
 * set password) shared by forgot-password and a new user's first activation.
 * A welcome/activation email links here with `?activate=1` (no secret token);
 * `flow` only changes the copy, the backend calls are identical either way.
 */
export default function ForgotPassword(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const settings = useGlobalSettings();
  const activePolicy = settings.passwordPolicy ?? DEFAULT_GLOBAL_SETTINGS.passwordPolicy;
  const [searchParams, setSearchParams] = useSearchParams();
  const { requestPasswordOtp, verifyPasswordOtp, resetPasswordWithOtp } = useAuth();
  const formId = useId();
  const emailFieldId = `${formId}-email`;
  const passwordFieldId = `${formId}-password`;
  const confirmFieldId = `${formId}-confirm`;

  const [view, setView] = useState<View>("email");
  const [flow, setFlow] = useState<Flow>("reset");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(createEmptyOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCycle, setResendCycle] = useState(0);

  const resendCountdown = useResendCountdown(view === "otp", 60, resendCycle);

  useEffect(() => {
    if (!searchParams.get("activate")) return;
    setFlow("activate");
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleRequestCode = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const emailError = validateAuthEmail(email, t);
    if (emailError) {
      setError(emailError);
      focusAuthField(emailFieldId);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await requestPasswordOtp(email.trim());
      setView("otp");
    } catch (requestError: unknown) {
      setError(isApiError(requestError) ? requestError.message : t("errors.module.description"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    setLoading(true);
    try {
      await requestPasswordOtp(email.trim());
      setResendCycle((cycle) => cycle + 1);
      setError("");
      setCode(createEmptyOtp());
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!isOtpComplete(code)) {
      setError(t("auth.otpIncomplete"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyPasswordOtp(email.trim(), code.join(""));
      setView("reset");
    } catch {
      setError(t("auth.otpInvalid"));
      setCode(createEmptyOtp());
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t("auth.forgotPasswordMismatch"));
      return;
    }
    const policy = validatePasswordPolicy(password, activePolicy);
    if (!policy.valid) {
      setError(policy.errorKey ? t(policy.errorKey) : policy.message);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPasswordWithOtp(email.trim(), code.join(""), password);
      notify.success(t("auth.passwordSetSuccess"));
      navigate(ROUTES.home, { replace: true });
    } catch (resetError: unknown) {
      setError(isApiError(resetError) ? resetError.message : t("errors.module.description"));
    } finally {
      setLoading(false);
    }
  };

  const title =
    view === "otp"
      ? t("auth.forgotEnterCodeTitle")
      : view === "reset"
        ? flow === "activate"
          ? t("auth.forgotActivatePasswordTitle")
          : t("auth.forgotNewPasswordTitle")
        : flow === "activate"
          ? t("auth.forgotActivateTitle")
          : t("auth.forgotTitle");

  const subtitle =
    view === "email"
      ? flow === "activate"
        ? t("auth.forgotActivateSubtitle")
        : t("auth.forgotSubtitle")
      : view === "otp"
        ? t("auth.codeSentTo") + " " + email
        : undefined;

  return (
    <>
      <EntryPageHead title={formatEntryTitle(title, t("entry.productName"))} description={t("entry.meta.tenantForgot")} />
      <AuthLayout title={title} subtitle={subtitle}>
        {error && <AuthStatusBanner message={error} />}

        {view === "email" && (
          <AuthStepForm onSubmit={handleRequestCode} busy={loading}>
            <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <AuthEmailField
                id={emailFieldId}
                label={t("auth.emailAddress")}
                value={email}
                autoFocus
                placeholder={t("auth.emailPlaceholder")}
                onChange={(value) => {
                  setEmail(value);
                  setError("");
                }}
              />
              <AuthSubmitButton busy={loading} busyLabel={t("auth.sendingResetLink")} label={t("auth.sendCode")} />
              <AuthBackLink to={ROUTES.login} label={t("auth.backToSignIn")} />
            </fieldset>
          </AuthStepForm>
        )}

        {view === "otp" && (
          <AuthStepForm onSubmit={handleVerifyCode} busy={loading}>
            <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <OtpInput
                value={code}
                onChange={(next) => {
                  setCode(next);
                  if (error) setError("");
                }}
                ariaLabel={title}
                disabled={loading}
                hasError={Boolean(error)}
              />
              <AuthSubmitButton
                busy={loading}
                busyLabel={t("auth.verifying")}
                label={t("auth.verifySignIn")}
                disabled={!isOtpComplete(code)}
                showArrow={false}
              />
              <AuthResendCodeControl
                countdown={resendCountdown}
                onResend={() => void handleResend()}
                disabled={loading}
                countdownLabel={t("auth.resendCountdown", { seconds: resendCountdown })}
                resendLabel={t("auth.resendCode")}
              />
              <AuthBackLink to={ROUTES.login} label={t("auth.backToSignIn")} />
            </fieldset>
          </AuthStepForm>
        )}

        {view === "reset" && (
          <AuthStepForm onSubmit={handleSetPassword} busy={loading}>
            <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
              <div className="space-y-2">
                <AuthPasswordField
                  id={passwordFieldId}
                  label={t("auth.password")}
                  value={password}
                  autoComplete="new-password"
                  onChange={(value) => {
                    setPassword(value);
                    setError("");
                  }}
                />
                <PasswordStrengthMeter password={password} />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(getPasswordPolicyHintKey(activePolicy))}
                </p>
              </div>
              <AuthPasswordField
                id={confirmFieldId}
                label={t("auth.forgotConfirmPasswordLabel")}
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(value) => {
                  setConfirmPassword(value);
                  setError("");
                }}
              />
              <AuthSubmitButton busy={loading} busyLabel={t("auth.settingPassword")} label={t("auth.setPassword")} />
            </fieldset>
          </AuthStepForm>
        )}
      </AuthLayout>
    </>
  );
}
