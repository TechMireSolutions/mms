import React, { useMemo, useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
import {
  AuthBackLink,
  AuthMutedPanel,
  AuthResendCodeControl,
  AuthStatusBanner,
  AuthSubmitButton,
  EntryPageHead,
  formatEntryTitle,
} from "@/components/entry";
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
          <fieldset disabled={loading} className="m-0 min-w-0 space-y-5 border-0 p-0">
            <AuthMutedPanel align="center">
              <p className="text-xs text-muted-foreground">
                {t("auth.codeSentTo")}{" "}
                <span className="font-medium text-foreground">{maskedEmail}</span>
              </p>
            </AuthMutedPanel>

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

            <AuthSubmitButton
              busy={loading}
              busyLabel={t("auth.verifying")}
              label={t("auth.verifySignIn")}
              disabled={!isComplete}
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
        </form>
      </AuthLayout>
    </>
  );
}
