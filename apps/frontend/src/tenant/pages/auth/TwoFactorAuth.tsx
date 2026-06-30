import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import {
  DEFAULT_GLOBAL_SETTINGS,
  maskEmail,
  mergeGlobalSettings,
  requiresTwoFactor,
  resolveNotificationChannel,
  type GlobalSettings,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import AuthLayout from "@/tenant/components/AuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { DEFAULT_AUTH_REDIRECT, ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FORM_ERROR, FORM_OTP_DIGIT } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import {
  getPendingChallengeId,
  is2FAVerified,
  resend2FACode,
  verify2FACode,
} from "@/lib/twoFactor";

const CODE_LENGTH = 6;

/**
 * Two-factor verification after login when global settings require it.
 */
export default function TwoFactorAuth(): React.JSX.Element {
  const { isAuthenticated, user, checkUserAuth } = useAuth();
  const [settings, setSettings] = useState<GlobalSettings>(() =>
    mergeGlobalSettings(DEFAULT_GLOBAL_SETTINGS),
  );
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const challengeId = getPendingChallengeId();
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? DEFAULT_AUTH_REDIRECT;

  useEffect(() => {
    void import("@/lib/settingsPreviewStore").then(({ getScopedGlobalSettings }) => {
      setSettings(getScopedGlobalSettings());
    });
  }, []);

  const maskedEmail = useMemo(() => {
    const email = user?.email ?? "";
    return email ? maskEmail(email) : "your email";
  }, [user?.email]);

  const twoFactorSubtitleKey = useMemo(() => {
    switch (resolveNotificationChannel(settings)) {
      case "sms":
        return "auth.twoFactorSubtitleSms" as const;
      case "none":
        return "auth.twoFactorSubtitleNone" as const;
      default:
        return "auth.twoFactorSubtitleEmail" as const;
    }
  }, [settings]);

  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  if (!challengeId && !isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (isAuthenticated && (!requiresTwoFactor(settings, user) || is2FAVerified())) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (i: number, val: string): void => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    setError("");
    if (val && i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const next = [...code];
    pasted.split("").forEach((digit: string, digitIndex: number) => { next[digitIndex] = digit; });
    setCode(next);
    inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const isComplete = code.every((d) => d !== "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!isComplete || !challengeId) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setError("");

    const entered = code.join("");
    const ok = await verify2FACode(challengeId, entered);
    if (ok) {
      await checkUserAuth({ force: true });
      navigate(redirectTo, { replace: true });
    } else {
      setError("Invalid or expired code. Please try again.");
      setCode(Array(CODE_LENGTH).fill(""));
      inputs.current[0]?.focus();
    }
    setLoading(false);
  };

  const handleResend = async (): Promise<void> => {
    if (!challengeId) return;
    const ok = await resend2FACode(challengeId);
    if (!ok) {
      setError("Could not resend code. Return to sign in and try again.");
      return;
    }
    setResendCountdown(30);
    setError("");
    setCode(Array(CODE_LENGTH).fill(""));
    inputs.current[0]?.focus();
  };

  return (
    <>
      <EntryPageHead
        title={formatEntryTitle(t("auth.twoFactorTitle"), t("entry.productName"))}
        description={t("entry.meta.tenantTwoFactor")}
      />
      <AuthLayout
        title={t("auth.twoFactorTitle")}
        subtitle={t(twoFactorSubtitleKey)}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              {t("auth.codeSentTo")}{" "}
              <span className="font-medium text-foreground">{maskedEmail}</span>
            </p>
          </div>

          <div className="flex justify-center gap-2.5">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className={cn(
                  FORM_OTP_DIGIT,
                  digit ? "border-primary/60 bg-primary/5" : "border-border",
                  error && "border-destructive/60 bg-destructive/5",
                )}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error ? (
            <p className={cn(FORM_ERROR, "text-center text-sm font-medium")}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !isComplete}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.verifySignIn")}
          </button>

          <div className="text-center">
            {resendCountdown > 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("auth.resendCountdown", { seconds: resendCountdown })}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void handleResend()}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                {t("auth.resendCode")}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Link to={ROUTES.login} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <ArrowLeft className="h-3 w-3" />
              {t("auth.backToSignIn")}
            </Link>
          </p>
        </form>
      </AuthLayout>
    </>
  );
}
