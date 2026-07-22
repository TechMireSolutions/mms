import React, { useState } from "react";
import {
  ArrowRight,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import { type PlatformSetupRegisterResult, maskEmail } from "@mms/shared";
import {
  getPlatformEmailError,
  getPlatformNameError,
  getPlatformPasswordError,
} from "@/platform/lib/platformValidation";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import PlatformPasswordInput from "@/platform/components/PlatformPasswordInput";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { PlatformAlert } from "@/platform/components/PlatformAlert";
import { OtpInput, createEmptyOtp, isOtpComplete } from "@/components/ui/OtpInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useResendCountdown } from "@/hooks/useResendCountdown";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useInvalidatePlatformSetupStatus } from "@/platform/hooks/usePlatformSetupStatus";
import {
  usePlatformSetupRegister,
  usePlatformSetupResend,
  usePlatformSetupVerify,
} from "@/platform/hooks/usePlatformAuthActions";

interface PlatformSetupProps {
  smtpConfigured: boolean;
}

type SetupStep = "register" | "verify";

/**
 * First-run wizard to create the platform super-user with email verification.
 */
export default function PlatformSetup({ smtpConfigured }: PlatformSetupProps): React.JSX.Element {
  const { t } = useTranslation();
  const checkPlatformAuth = usePlatformAuth().checkPlatformAuth;
  const invalidateSetupStatus = useInvalidatePlatformSetupStatus();

  const registerMutation = usePlatformSetupRegister();
  const verifyMutation = usePlatformSetupVerify();
  const resendMutation = usePlatformSetupResend();

  const [step, setStep] = useState<SetupStep>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupSession, setSetupSession] = useState<PlatformSetupRegisterResult | null>(null);
  const [code, setCode] = useState(createEmptyOtp);
  const [error, setError] = useState<string | null>(null);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);
  const [resendCycle, setResendCycle] = useState(0);
  const resendCountdown = useResendCountdown(step === "verify", 30, resendCycle);

  const loading = registerMutation.isPending || verifyMutation.isPending || resendMutation.isPending;

  const handleRegister = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSetupNotice(null);

    const emailError = getPlatformEmailError(email, t);
    if (emailError) {
      setError(emailError);
      return;
    }
    const nameError = getPlatformNameError(name, t);
    if (nameError) {
      setError(nameError);
      return;
    }
    const passwordError = getPlatformPasswordError(password, t);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!smtpConfigured && import.meta.env.PROD) {
      setError(t("platform.setupSmtpRequired"));
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSetupSession(result);
      setStep("verify");
      setCode(createEmptyOtp());
      setSetupNotice(result.emailSent ? t("platform.setupEmailSent") : null);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleVerify = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!setupSession) return;

    setError(null);
    try {
      await verifyMutation.mutateAsync({
        setupId: setupSession.setupId,
        code: code.join(""),
      });
      invalidateSetupStatus();
      await checkPlatformAuth();
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!setupSession || resendCountdown > 0) return;
    setError(null);
    try {
      const result = await resendMutation.mutateAsync(setupSession.setupId);
      setSetupSession(result);
      setSetupNotice(result.emailSent ? t("platform.setupEmailSent") : null);
      setResendCycle((value) => value + 1);
    } catch (err) {
      setError(getPlatformErrorMessage(err, t));
    }
  };

  const pageHead = (
    <EntryPageHead
      title={formatEntryTitle(
        step === "verify" ? t("platform.setupVerifyTitle") : t("platform.setupTitle"),
        t("entry.productName"),
      )}
      description={t("entry.meta.platformSetup")}
    />
  );

  if (step === "verify" && setupSession) {
    return (
      <>
        {pageHead}
        <PlatformAuthLayout
        title={t("platform.setupVerifyTitle")}
        subtitle={t("platform.setupVerifySubtitle", { email: maskEmail(setupSession.email) })}
      >
        <form onSubmit={(event) => void handleVerify(event)} className="space-y-4">
          {error ? <PlatformAlert message={error} /> : null}
          {setupNotice ? <PlatformAlert variant="info" message={setupNotice} /> : null}
          {setupSession.devCode ? (
            <PlatformAlert variant="warning" message={t("platform.setupDevCodeHint", { code: setupSession.devCode })} />
          ) : null}

          <OtpInput
            value={code}
            onChange={setCode}
            ariaLabel={t("platform.setupVerifyEmail")}
            disabled={loading}
            idPrefix="platform-otp"
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
      </PlatformAuthLayout>
      </>
    );
  }

  return (
    <>
      {pageHead}
      <PlatformAuthLayout title={t("platform.setupTitle")} subtitle={t("platform.setupSubtitle")}>
      <form onSubmit={(event) => void handleRegister(event)} className="space-y-4">
        {!smtpConfigured && import.meta.env.PROD ? (
          <PlatformAlert variant="warning" message={t("platform.setupSmtpRequired")} />
        ) : null}
        {error ? <PlatformAlert message={error} /> : null}

        <div className="space-y-1.5">
          <label htmlFor="platform-setup-name" className={FORM_LABEL}>{t("platform.setupFullName")}</label>
          <div className="relative">
            <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              id="platform-setup-name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="ps-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="platform-setup-email" className={FORM_LABEL}>{t("auth.email")}</label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <Input
              id="platform-setup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="ps-9"
            />
          </div>
        </div>

        <PlatformPasswordInput
          id="platform-setup-password"
          label={t("auth.password")}
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button type="submit" className="w-full h-11" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              {t("common.save")}
            </>
          ) : (
            <>
              {t("platform.setupCreateAccount")}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden />
            </>
          )}
        </Button>
      </form>
    </PlatformAuthLayout>
    </>
  );
}


