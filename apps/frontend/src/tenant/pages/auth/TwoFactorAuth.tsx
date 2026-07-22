import React, { useState, useEffect, useMemo } from "react";
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
import { FORM_ERROR } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import {
  getPendingChallengeId,
  is2FAVerified,
  resend2FACode,
  verify2FACode,
} from "@/lib/twoFactor";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { OtpInput, createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";

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

  const [code, setCode] = useState(createEmptyOtp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCycle, setResendCycle] = useState(0);

  const resendCountdown = useResendCountdown(challengeId !== null, 30, resendCycle);

  if (!challengeId && !isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (isAuthenticated && (!requiresTwoFactor(settings, user) || is2FAVerified())) {
    return <Navigate to={redirectTo} replace />;
  }

  const isComplete = isOtpComplete(code);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!isComplete || !challengeId) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    setError("");

    const entered = code.join("");
    const ok = await verify2FACode(challengeId, entered);
    if (ok) {
      await checkUserAuth();
      navigate(redirectTo, { replace: true });
    } else {
      setError("Invalid or expired code. Please try again.");
      setCode(createEmptyOtp());
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
    setResendCycle((c) => c + 1);
    setError("");
    setCode(createEmptyOtp());
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

          <OtpInput
            value={code}
            onChange={setCode}
            ariaLabel={t("auth.twoFactorTitle")}
            disabled={loading}
            hasError={Boolean(error)}
          />

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
