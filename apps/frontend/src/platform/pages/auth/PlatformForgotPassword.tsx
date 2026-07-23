import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
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
import { Alert } from "@/components/ui/Alert";
import { OtpInput, createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
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

    if (!isOtpComplete(code)) return;

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
        <form onSubmit={(event) => void handleReset(event)} className="space-y-4">
          {error ? <Alert message={error} /> : null}
          {devHint ? <Alert variant="warning" message={devHint} /> : null}

          <OtpInput
            value={code}
            onChange={setCode}
            ariaLabel={t("platform.forgotEnterCode")}
            disabled={loading}
          />

          <PasswordInput
            id="platform-new-password"
            label={t("platform.forgotNewPassword")}
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <PasswordInput
            id="platform-confirm-password"
            label={t("platform.forgotConfirmPassword")}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          <Button type="submit" className="w-full h-11" disabled={loading || !isOtpComplete(code)}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                {t("common.save")}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" aria-hidden />
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
            <RefreshCw className="w-4 h-4" aria-hidden />
            {resendCountdown > 0
              ? t("platform.setupResendIn", { seconds: String(resendCountdown) })
              : t("platform.setupResendCode")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to={ROUTES.home} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 rtl:rotate-180" aria-hidden />
              {t("auth.backToSignIn")}
            </Link>
          </p>
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" aria-hidden />
            </div>
          </div>

          {devHint ? <Alert variant="warning" message={devHint} /> : null}

          {resetId ? (
            <Button type="button" className="w-full h-11" onClick={() => navigate(resetPath(resetId))}>
              {t("platform.forgotEnterCode")}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden />
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setSent(false);
              setEmail("");
              setDevHint(null);
            }}
          >
            {t("auth.tryDifferentEmail")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to={ROUTES.home} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3 rtl:rotate-180" aria-hidden />
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </div>
      </PlatformAuthLayout>
      </>
    );
  }

  return (
    <>
      {pageHead}
      <PlatformAuthLayout title={t("platform.forgotTitle")} subtitle={t("platform.forgotSubtitle")}>
      <form onSubmit={(event) => void handleRequest(event)} className="space-y-4">
        {error ? <Alert message={error} /> : null}

        <div className="space-y-1.5">
          <label htmlFor="platform-forgot-email" className={FORM_LABEL}>{t("auth.email")}</label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              id="platform-forgot-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="ps-9"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              {t("common.loading")}
            </>
          ) : (
            <>
              {t("platform.forgotSendLink")}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to={ROUTES.home} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3 rtl:rotate-180" aria-hidden />
            {t("auth.backToSignIn")}
          </Link>
        </p>
      </form>
    </PlatformAuthLayout>
    </>
  );
}


