import React, { useMemo, useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
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
import { AuthBackLink } from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import { DEFAULT_AUTH_REDIRECT, ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  getPendingChallengeId,
  is2FAVerified,
  resend2FACode,
  verify2FACode,
} from "@/lib/twoFactor";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { OtpInput, createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/button";

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
    return email ? maskEmail(email) : t("auth.maskedEmailFallback");
  }, [user?.email, t]);

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
      setError(t("auth.otpIncomplete"));
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
      setError(t("auth.otpInvalid"));
      setCode(createEmptyOtp());
    }
    setLoading(false);
  };

  const handleResend = async (): Promise<void> => {
    if (!challengeId) return;
    const ok = await resend2FACode(challengeId);
    if (!ok) {
      setError(t("auth.otpResendFailed"));
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
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" noValidate aria-busy={loading}>
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10" aria-hidden>
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground">
              {t("auth.codeSentTo")}{" "}
              <span className="font-medium text-foreground">{maskedEmail}</span>
            </p>
          </div>

          <OtpInput
            value={code}
            onChange={(next) => {
              setCode(next);
              if (error) setError("");
            }}
            ariaLabel={t("auth.twoFactorTitle")}
            disabled={loading}
            hasError={Boolean(error)}
          />

          {error ? <AuthStatusBanner message={error} /> : null}

          <Button
            type="submit"
            size="lg"
            disabled={loading || !isComplete}
            className="h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("auth.verifying")}
              </>
            ) : (
              t("auth.verifySignIn")
            )}
          </Button>

          <div className="text-center">
            {resendCountdown > 0 ? (
              <p className="text-xs text-muted-foreground" role="status">
                {t("auth.resendCountdown", { seconds: resendCountdown })}
              </p>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleResend()}
                disabled={loading}
                className="h-10 gap-1.5 text-xs font-medium text-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                {t("auth.resendCode")}
              </Button>
            )}
          </div>

          <AuthBackLink to={ROUTES.login} label={t("auth.backToSignIn")} />
        </form>
      </AuthLayout>
    </>
  );
}
