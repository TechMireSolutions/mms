import React, { useId, useState } from "react";
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import { type PlatformSetupRegisterResult, maskEmail } from "@mms/shared";
import {
  getPlatformRegisterError,
} from "@/platform/lib/platformValidation";
import PlatformAuthLayout from "@/platform/components/PlatformAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthEmailField } from "@/components/entry/AuthEmailField";
import { AuthSubmitButton } from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import { Alert } from "@/components/ui/Alert";
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
  const formId = useId();
  const nameFieldId = `${formId}-name`;
  const emailFieldId = `${formId}-email`;

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

    const validationError = getPlatformRegisterError(name, email, password, t);
    if (validationError) {
      setError(validationError);
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

    if (!isOtpComplete(code)) {
      setError(t("auth.otpIncomplete"));
      return;
    }

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
          <form onSubmit={(event) => void handleVerify(event)} className="space-y-4" noValidate aria-busy={loading}>
            {error ? <AuthStatusBanner message={error} /> : null}
            {setupNotice ? <Alert variant="info" message={setupNotice} /> : null}
            {setupSession.devCode ? (
              <Alert variant="warning" message={t("platform.setupDevCodeHint", { code: setupSession.devCode })} />
            ) : null}

            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next);
                if (error) setError(null);
              }}
              ariaLabel={t("platform.setupVerifyEmail")}
              disabled={loading}
              idPrefix="platform-otp"
              hasError={Boolean(error)}
            />

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/10"
              disabled={loading || !isOtpComplete(code)}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("auth.verifying")}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
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
              <RefreshCw className="h-4 w-4" aria-hidden />
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
        <form onSubmit={(event) => void handleRegister(event)} className="space-y-4" noValidate aria-busy={loading}>
          {!smtpConfigured && import.meta.env.PROD ? (
            <Alert variant="warning" message={t("platform.setupSmtpRequired")} />
          ) : null}
          {error ? <AuthStatusBanner message={error} /> : null}

          <fieldset disabled={loading} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <div className="space-y-1.5 text-start">
              <label htmlFor={nameFieldId} className={FORM_LABEL}>{t("platform.setupFullName")}</label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80"
                  aria-hidden
                />
                <Input
                  id={nameFieldId}
                  autoComplete="name"
                  autoFocus
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                  }}
                  className="h-11 ps-9"
                />
              </div>
            </div>

            <AuthEmailField
              id={emailFieldId}
              label={t("auth.email")}
              value={email}
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              onChange={(value) => {
                setEmail(value);
                setError(null);
              }}
            />

            <PasswordInput
              id="platform-setup-password"
              label={t("auth.password")}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="h-11"
            />

            <AuthSubmitButton
              busy={loading}
              busyLabel={t("common.save")}
              label={t("platform.setupCreateAccount")}
            />
          </fieldset>
        </form>
      </PlatformAuthLayout>
    </>
  );
}
