import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { maskEmail, requiresTwoFactor, resolveNotificationChannel } from "@mms/shared";
import useTranslation from "@/hooks/useTranslation";
import AuthLayout from "@/tenant/components/AuthLayout";
import { DEFAULT_AUTH_REDIRECT, ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/lib/contexts/AuthContext';
import useGlobalSettings from "@/hooks/useGlobalSettings";
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
  const settings = useGlobalSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const challengeId = getPendingChallengeId();
  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? DEFAULT_AUTH_REDIRECT;

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
    pasted.split("").forEach((c: string, idx: number) => { next[idx] = c; });
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
    <AuthLayout
      title={t("auth.twoFactorTitle")}
      subtitle={t(twoFactorSubtitleKey)}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t("auth.codeSentTo")}{" "}
            <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2.5">
          {code.map((digit, i) => (
            <motion.input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(FORM_ERROR, "text-center text-sm font-medium")}
          >
            {error}
          </motion.p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !isComplete}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.verifySignIn")}
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
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              {t("auth.resendCode")}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link to={ROUTES.login} className="text-primary font-medium hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            {t("auth.backToSignIn")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
