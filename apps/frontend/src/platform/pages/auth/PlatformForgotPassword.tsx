import React, { useEffect, useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import {
  getPlatformPasswordError,
  getPlatformPasswordMatchError,
} from "@/platform/lib/platformValidation";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import {
  AuthBackLink,
  AuthCheckEmailSuccess,
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
  const newPasswordId = `${formId}-new-password`;
  const confirmPasswordId = `${formId}-confirm-password`;

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
  const [emailError, setEmailError] = useState<string | undefined>();
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

    const fieldError = validateAuthEmail(email, t);
    if (fieldError) {
      setEmailError(fieldError);
      focusAuthField(emailFieldId);
      return;
    }
    setEmailError(undefined);

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
            <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
              {devHint ? <AuthStatusBanner variant="warning" message={devHint} /> : null}

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

              {error ? <AuthStatusBanner message={error} /> : null}

              <AuthPasswordField
                id={newPasswordId}
                label={t("platform.forgotNewPassword")}
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />

              <AuthPasswordField
                id={confirmPasswordId}
                label={t("platform.forgotConfirmPassword")}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              <AuthSubmitButton
                busy={loading}
                busyLabel={t("common.save")}
                label={t("platform.forgotResetPassword")}
                disabled={!isOtpComplete(code)}
                icon={ShieldCheck}
                showArrow={false}
              />

              <AuthResendCodeControl
                countdown={resendCountdown}
                onResend={() => void handleResend()}
                disabled={loading}
                countdownLabel={t("auth.resendCountdown", { seconds: resendCountdown })}
                resendLabel={t("auth.resendCode")}
              />

              <AuthBackLink to={ROUTES.home} label={t("auth.backToSignIn")} />
            </fieldset>
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
          <AuthCheckEmailSuccess
            secondaryLabel={t("auth.tryDifferentEmail")}
            onSecondary={() => {
              setSent(false);
              setEmail("");
              setDevHint(null);
            }}
            footer={<AuthBackLink to={ROUTES.home} label={t("auth.backToSignIn")} />}
          >
            {devHint ? <AuthStatusBanner variant="warning" message={devHint} /> : null}
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
          </AuthCheckEmailSuccess>
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
              label={t("auth.emailAddress")}
              value={email}
              autoFocus
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              error={emailError}
              onChange={(value) => {
                setEmail(value);
                setEmailError(undefined);
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
