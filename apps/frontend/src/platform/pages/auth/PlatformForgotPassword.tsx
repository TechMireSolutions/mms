import React, { useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  getPlatformEmailError,
  getPlatformPasswordError,
  getPlatformPasswordMatchError,
} from "@/platform/lib/platformValidation";

import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthEmailField } from "@/components/entry/AuthEmailField";
import { AuthBackLink, AuthSubmitButton } from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import { Alert } from "@/components/ui/Alert";
import { OtpInput, createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { ROUTES } from "@/lib/config/routes";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import {
  usePlatformPasswordForgot,
  usePlatformPasswordReset,
  usePlatformPasswordResetResend,
} from "@/platform/hooks/usePlatformAuthActions";

/**
 * Apex-only forgot password for platform super-users (email OTP + new password).
 */
export default function PlatformForgotPassword(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkPlatformAuth } = usePlatformAuth();
  const formId = useId();
  const emailFieldId = `${formId}-email`;

  const forgotMutation = usePlatformPasswordForgot();
  const resetMutation = usePlatformPasswordReset();
  const resendMutation = usePlatformPasswordResetResend();

  const resetIdParam = searchParams.get("resetId")?.trim() ?? "";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetId, setResetId] = useState(resetIdParam);
  const [code, setCode] = useState(createEmptyOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);

  const loading = forgotMutation.isPending || resetMutation.isPending || resendMutation.isPending;

  const isResetStep = Boolean(resetId);
  const [resendCycle, setResendCycle] = useState(0);
  const resendCountdown = useResendCountdown(isResetStep, 30, resendCycle);

  useEffect(() => {
    if (resetIdParam) setResetId(resetIdParam);
  }, [resetIdParam]);

  const resetPath = (passwordResetId: string): string =>
    `${ROUTES.platformForgotPassword}?resetId=${encodeURIComponent(passwordResetId)}`;

  const handleRequest = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setDevHint(null);

    const emailError = getPlatformEmailError(email, t);
    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      const result = await forgotMutation.mutateAsync({ email: email.trim() });
      setSent(true);
      if (result.devReset) {
        setDevHint(t("platform.forgotDevResetHint", { code: result.devReset.code, resetId: result.devReset.resetId }));
        setResetId(result.devReset.resetId);
      }
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleReset = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!resetId) return;

    const matchError = getPlatformPasswordMatchError(password, confirmPassword, t);
    if (matchError) {
      setError(matchError);
      return;
    }

    const passwordError = getPlatformPasswordError(password, t);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!isOtpComplete(code)) {
      setError(t("auth.otpIncomplete"));
      return;
    }

    setError(null);
    try {
      await resetMutation.mutateAsync({
        resetId,
        code: code.join(""),
        password,
      });
      await checkPlatformAuth();
      navigate(ROUTES.home, { replace: true });
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!resetId || resendCountdown > 0) return;
    setError(null);
    try {
      const result = await resendMutation.mutateAsync(resetId);
      if (result.devReset) {
        setDevHint(t("platform.forgotDevResetHint", { code: result.devReset.code, resetId: result.devReset.resetId }));
      }
      setResendCycle((value) => value + 1);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const forgotTitle = isResetStep
    ? t("platform.forgotResetTitle")
    : sent
      ? t("auth.forgotCheckEmail")
      : t("platform.forgotTitle");

  const pageHead = (
    <EntryPageHead
      title={formatEntryTitle(forgotTitle, t("entry.productName"))}
      description={t("entry.meta.platformForgot")}
    />
  );

  if (isResetStep) {
    return (
      <>
        {pageHead}
        <PlatformAuthLayout title={t("platform.forgotResetTitle")} subtitle={t("platform.forgotResetSubtitle")}>
          <form onSubmit={(event) => void handleReset(event)} className="space-y-4" noValidate aria-busy={loading}>
            {error ? <AuthStatusBanner message={error} /> : null}
            {devHint ? <Alert variant="warning" message={devHint} /> : null}

            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (error) setError(null);
              }}
              ariaLabel={t("platform.forgotEnterCode")}
              disabled={loading}
              hasError={Boolean(error)}
            />

            <PasswordInput
              id="platform-new-password"
              label={t("platform.forgotNewPassword")}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11"
            />

            <PasswordInput
              id="platform-confirm-password"
              label={t("platform.forgotConfirmPassword")}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11"
            />

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/10"
              disabled={loading || !isOtpComplete(code)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("common.save")}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  {t("platform.forgotResetPassword")}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={loading || resendCountdown > 0}
              onClick={() => void handleResend()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              {resendCountdown > 0
                ? t("platform.setupResendIn", { seconds: String(resendCountdown) })
                : t("platform.setupResendCode")}
            </Button>

            <AuthBackLink to={ROUTES.home} label={t("auth.backToSignIn")} />
          </form>
        </PlatformAuthLayout>
      </>
    );
  }

  if (sent) {
    return (
      <>
        {pageHead}
        <PlatformAuthLayout
          title={t("auth.forgotCheckEmail")}
          subtitle={t("platform.forgotSentGeneric", { email: email.trim() })}
        >
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10" aria-hidden>
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>

            {devHint ? <Alert variant="warning" message={devHint} /> : null}

            {resetId ? (
              <Button
                type="button"
                size="lg"
                className="h-11 w-full rounded-xl font-semibold"
                onClick={() => navigate(resetPath(resetId))}
              >
                {t("platform.forgotEnterCode")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={() => {
                setSent(false);
                setEmail("");
                setDevHint(null);
              }}
            >
              {t("auth.tryDifferentEmail")}
            </Button>

            <AuthBackLink to={ROUTES.home} label={t("auth.backToSignIn")} />
          </div>
        </PlatformAuthLayout>
      </>
    );
  }

  return (
    <>
      {pageHead}
      <PlatformAuthLayout title={t("platform.forgotTitle")} subtitle={t("platform.forgotSubtitle")}>
        <form onSubmit={(event) => void handleRequest(event)} className="space-y-4" noValidate aria-busy={loading}>
          {error ? <AuthStatusBanner message={error} /> : null}

          <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <AuthEmailField
              id={emailFieldId}
              label={t("auth.email")}
              value={email}
              autoFocus
              autoComplete="username"
              placeholder={t("auth.emailPlaceholder")}
              onChange={(value) => {
                setEmail(value);
                setError(null);
              }}
            />

            <AuthSubmitButton
              busy={loading}
              busyLabel={t("auth.sendingResetLink")}
              label={t("platform.forgotSendLink")}
            />

            <AuthBackLink to={ROUTES.home} label={t("auth.backToSignIn")} />
          </fieldset>
        </form>
      </PlatformAuthLayout>
    </>
  );
}
