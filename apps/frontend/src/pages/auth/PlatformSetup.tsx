import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import type { PlatformSetupRegisterResult } from "@mms/shared";
import {
  PLATFORM_MIN_PASSWORD_LENGTH,
  maskEmail,
  validatePlatformSetupEmail,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
} from "@mms/shared";
import AuthLayout from "@/components/auth/AuthLayout";
import PlatformOtpInput, { createEmptyOtp, isOtpComplete } from "@/components/platform/PlatformOtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useTranslation from "@/hooks/useTranslation";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { apiJson, ApiError } from "@/lib/apiClient";
import { mapPlatformAuthError } from "@/lib/platformAuthErrors";
import { usePlatformAuth } from "@/lib/contexts/PlatformAuthContext";
import { useInvalidatePlatformSetupStatus } from "@/hooks/usePlatformSetupStatus";

interface PlatformSetupProps {
  smtpConfigured: boolean;
}

type SetupStep = "register" | "verify";

/**
 * First-run wizard to create the platform super-user with email verification.
 */
export default function PlatformSetup({ smtpConfigured }: PlatformSetupProps): React.JSX.Element {
  const { t } = useTranslation();
  const { checkPlatformAuth } = usePlatformAuth();
  const invalidateSetupStatus = useInvalidatePlatformSetupStatus();

  const [step, setStep] = useState<SetupStep>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupSession, setSetupSession] = useState<PlatformSetupRegisterResult | null>(null);
  const [code, setCode] = useState(createEmptyOtp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendCycle, setResendCycle] = useState(0);
  const resendCountdown = useResendCountdown(step === "verify", 30, resendCycle);

  const handleRegister = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const emailKey = validatePlatformSetupEmail(email);
    if (emailKey) {
      setError(t(emailKey));
      return;
    }
    const nameKey = validatePlatformSetupName(name);
    if (nameKey) {
      setError(t(nameKey));
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

    if (!smtpConfigured && import.meta.env.PROD) {
      setError(t("platform.setupSmtpRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await apiJson<PlatformSetupRegisterResult>("/api/platform/auth/setup/register", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      setSetupSession(result);
      setStep("verify");
      setCode(createEmptyOtp());
      setInfo(result.emailSent ? t("platform.setupEmailSent") : null);
    } catch (err) {
      setError(err instanceof ApiError ? mapPlatformAuthError(err, t) : t("errors.boundary.description"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!setupSession) return;

    setLoading(true);
    setError(null);
    try {
      await apiJson("/api/platform/auth/setup/verify", {
        method: "POST",
        body: JSON.stringify({ setupId: setupSession.setupId, code: code.join("") }),
      });
      invalidateSetupStatus();
      await checkPlatformAuth();
    } catch (err) {
      setError(err instanceof ApiError ? mapPlatformAuthError(err, t) : t("errors.boundary.description"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!setupSession || resendCountdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiJson<PlatformSetupRegisterResult>("/api/platform/auth/setup/resend", {
        method: "POST",
        body: JSON.stringify({ setupId: setupSession.setupId }),
      });
      setSetupSession(result);
      setInfo(result.emailSent ? t("platform.setupEmailSent") : null);
      setResendCycle((value) => value + 1);
    } catch (err) {
      setError(err instanceof ApiError ? mapPlatformAuthError(err, t) : t("errors.boundary.description"));
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify" && setupSession) {
    return (
      <AuthLayout
        title={t("platform.setupVerifyTitle")}
        subtitle={t("platform.setupVerifySubtitle", { email: maskEmail(setupSession.email) })}
      >
        <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
          {error ? <PlatformAlert message={error} /> : null}
          {info ? <PlatformInfo message={info} /> : null}
          {setupSession.devCode ? (
            <PlatformDevHint message={t("platform.setupDevCodeHint", { code: setupSession.devCode })} />
          ) : null}

          <PlatformOtpInput
            value={code}
            onChange={setCode}
            ariaLabel={t("platform.setupVerifyEmail")}
            disabled={loading}
          />

          <Button type="submit" className="w-full h-11" disabled={loading || !isOtpComplete(code)}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                {t("auth.verifySignIn")}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" aria-hidden />
                {t("platform.setupVerifyEmail")}
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
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("platform.setupTitle")} subtitle={t("platform.setupSubtitle")}>
      <form onSubmit={(e) => void handleRegister(e)} className="space-y-4">
        {!smtpConfigured && import.meta.env.PROD ? (
          <PlatformDevHint message={t("platform.setupSmtpRequired")} />
        ) : null}
        {error ? <PlatformAlert message={error} /> : null}

        <div className="space-y-2">
          <Label htmlFor="platform-setup-name">{t("platform.setupFullName")}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              id="platform-setup-name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform-setup-email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              id="platform-setup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform-setup-password">{t("auth.password")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              id="platform-setup-password"
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

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              {t("common.save")}
            </>
          ) : (
            <>
              {t("platform.setupCreateAccount")}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

function PlatformAlert({ message }: { message: string }): React.JSX.Element {
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

function PlatformInfo({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">{message}</div>
  );
}

function PlatformDevHint({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-foreground" role="status">
      {message}
    </div>
  );
}
