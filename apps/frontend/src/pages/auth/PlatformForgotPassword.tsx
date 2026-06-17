import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { PlatformPasswordForgotResult } from "@mms/shared";
import {
  PLATFORM_MIN_PASSWORD_LENGTH,
  validatePlatformSetupEmail,
  validatePlatformSetupPassword,
} from "@mms/shared";
import PlatformAuthLayout from "@/components/platform/PlatformAuthLayout";
import PlatformOtpInput, { createEmptyOtp, isOtpComplete } from "@/components/platform/PlatformOtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useTranslation from "@/hooks/useTranslation";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { apiJson, ApiError } from "@/lib/apiClient";
import { mapPlatformAuthError } from "@/lib/platformAuthErrors";
import { ROUTES } from "@/lib/config/routes";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";

/**
 * Apex-only forgot password for platform super-users (email OTP + new password).
 */
export default function PlatformForgotPassword(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkPlatformAuth } = usePlatformAuth();

  const resetIdParam = searchParams.get("resetId")?.trim() ?? "";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetId, setResetId] = useState(resetIdParam);
  const [code, setCode] = useState(createEmptyOtp);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);

  const isResetStep = Boolean(resetId);
  const [resendCycle, setResendCycle] = useState(0);
  const resendCountdown = useResendCountdown(isResetStep, 30, resendCycle);

  useEffect(() => {
    if (resetIdParam) setResetId(resetIdParam);
  }, [resetIdParam]);

  const resetPath = (id: string): string =>
    `${ROUTES.platformForgotPassword}?resetId=${encodeURIComponent(id)}`;

  const handleRequest = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setDevHint(null);

    const emailKey = validatePlatformSetupEmail(email);
    if (emailKey) {
      setError(t(emailKey));
      return;
    }

    setLoading(true);
    try {
      const result = await apiJson<PlatformPasswordForgotResult>("/api/platform/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
      if (result.devReset) {
        setDevHint(t("platform.forgotDevResetHint", { code: result.devReset.code, resetId: result.devReset.resetId }));
        setResetId(result.devReset.resetId);
      }
    } catch (err) {
      setError(err instanceof ApiError ? mapPlatformAuthError(err, t) : t("errors.boundary.description"));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!resetId) return;

    if (password !== confirmPassword) {
      setError(t("platform.forgotPasswordMismatch"));
      return;
    }

    const passwordKey = validatePlatformSetupPassword(password);
    if (passwordKey) {
      setError(
        passwordKey === "platform.setupPasswordTooShort"
          ? t(passwordKey, { min: String(PLATFORM_MIN_PASSWORD_LENGTH) })
          : t(passwordKey),
      );
      return;
    }

    if (!isOtpComplete(code)) return;

    setLoading(true);
    setError(null);
    try {
      await apiJson("/api/platform/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ resetId, code: code.join(""), password }),
      });
      await checkPlatformAuth();
      navigate(ROUTES.home, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? mapPlatformAuthError(err, t) : t("errors.boundary.description"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!resetId || resendCountdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiJson<PlatformPasswordForgotResult>("/api/platform/auth/password/resend", {
        method: "POST",
        body: JSON.stringify({ resetId }),
      });
      if (result.devReset) {
        setDevHint(t("platform.forgotDevResetHint", { code: result.devReset.code, resetId: result.devReset.resetId }));
      }
      setResendCycle((value) => value + 1);
    } catch (err) {
      setError(err instanceof ApiError ? mapPlatformAuthError(err, t) : t("errors.boundary.description"));
    } finally {
      setLoading(false);
    }
  };

  if (isResetStep) {
    return (
      <PlatformAuthLayout title={t("platform.forgotResetTitle")} subtitle={t("platform.forgotResetSubtitle")}>
        <form onSubmit={(e) => void handleReset(e)} className="space-y-4">
          {error ? <Alert message={error} /> : null}
          {devHint ? <DevHint message={devHint} /> : null}

          <PlatformOtpInput
            value={code}
            onChange={setCode}
            ariaLabel={t("platform.forgotEnterCode")}
            disabled={loading}
          />

          <div className="space-y-2">
            <Label htmlFor="platform-new-password">{t("platform.forgotNewPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="platform-new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PLATFORM_MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform-confirm-password">{t("platform.forgotConfirmPassword")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
              <Input
                id="platform-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={PLATFORM_MIN_PASSWORD_LENGTH}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

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
              <ArrowLeft className="w-3 h-3" aria-hidden />
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </form>
      </PlatformAuthLayout>
    );
  }

  if (sent) {
    return (
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

          {devHint ? <DevHint message={devHint} /> : null}

          {resetId ? (
            <Button type="button" className="w-full h-11" onClick={() => navigate(resetPath(resetId))}>
              {t("platform.forgotEnterCode")}
              <ArrowRight className="w-4 h-4" aria-hidden />
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
              <ArrowLeft className="w-3 h-3" aria-hidden />
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </div>
      </PlatformAuthLayout>
    );
  }

  return (
    <PlatformAuthLayout title={t("platform.forgotTitle")} subtitle={t("platform.forgotSubtitle")}>
      <form onSubmit={(e) => void handleRequest(e)} className="space-y-4">
        {error ? <Alert message={error} /> : null}

        <div className="space-y-2">
          <Label htmlFor="platform-forgot-email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              id="platform-forgot-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
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
              <ArrowRight className="w-4 h-4" aria-hidden />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to={ROUTES.home} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" aria-hidden />
            {t("auth.backToSignIn")}
          </Link>
        </p>
      </form>
    </PlatformAuthLayout>
  );
}

function Alert({ message }: { message: string }): React.JSX.Element {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

function DevHint({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-foreground">{message}</div>
  );
}
